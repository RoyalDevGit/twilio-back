import express, { Request, Response, NextFunction } from 'express'
import AWS from 'aws-sdk'
import { DateTime } from 'luxon'

import { Session, SessionModel, SessionStatus } from 'models/Session'
import { Env } from 'utils/env'
import { AuthenticatedRequest } from 'interfaces/Express'
import {
  ChimeEvent,
  ChimeEventDetail,
  ChimeMediaPipelineDeleted,
  ChimeMeetingEnded,
  ChimeMeetingStarted,
} from 'interfaces/ChimeEvent'
import { processChimeRecording } from 'utils/lambdas/processChimeRecording'
import { FileTrackerModel } from 'models/FileTracker'
import {
  VideoAudience,
  VideoModel,
  VideoStatus,
  VideoThumbnailType,
  VideoType,
  VideoVisibility,
} from 'models/Video'
import { getThumbnailsFromVideo } from 'utils/lambdas/getThumbnailsFromVideo'
import { getSystemAccount } from 'repositories/user/getSystemAccount'
import { ApiError, ApiErrorCode } from 'utils/error/ApiError'
import { requireAuthenticationMiddlewares } from 'middleware/authMiddleware'
import { queueSessionRecodingAvailableNotification } from 'notifications/RecordingAvailable'

export const chimeEventRouterPathPrefix = '/chime-events'
export const ChimeEventRouter = express.Router()

const AWS_REGION = Env.getString('AWS_REGION')
const AWS_ACCESS_KEY_ID = Env.getString('AWS_ACCESS_KEY_ID')
const AWS_SECRET_ACCESS_KEY = Env.getString('AWS_SECRET_ACCESS_KEY')
const AWS_CHIME_ENDPOINT = Env.getString('AWS_CHIME_ENDPOINT')
const AWS_CHIME_MEETINGS_ENDPOINT = Env.getString('AWS_CHIME_MEETINGS_ENDPOINT')
const AWS_S3_VIDEO_ASSETS_BUCKET = Env.getString('AWS_S3_VIDEO_ASSETS_BUCKET')
const AWS_CHIME_MEETINGS_RECORDINGS_BUCKET = Env.getString(
  'AWS_CHIME_MEETINGS_RECORDINGS_BUCKET'
)
const AWS_EVENTS_API_KEY = Env.getString('AWS_EVENTS_API_KEY')

const chime = new AWS.Chime({
  region: AWS_REGION,
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
})
chime.endpoint = new AWS.Endpoint(AWS_CHIME_ENDPOINT)

const chimeRegional = new AWS.ChimeSDKMeetings({
  region: AWS_REGION,
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
})
chimeRegional.endpoint = new AWS.Endpoint(AWS_CHIME_MEETINGS_ENDPOINT)

const processMeetingStartedEvent = async (
  event: ChimeEvent<ChimeEventDetail>,
  session: Session
) => {
  const meetingStartedEvent = event.detail as ChimeMeetingStarted
  const meetingStarted = DateTime.fromMillis(meetingStartedEvent.timestamp, {
    zone: 'utc',
  })

  const meetingEnded = session.ended
    ? DateTime.fromJSDate(session.ended)
    : undefined

  let totalMilliseconds: number | undefined

  if (meetingStarted && meetingEnded) {
    totalMilliseconds = meetingEnded.diff(meetingStarted).milliseconds
  }

  await SessionModel.findByIdAndUpdate(session.id, {
    status: SessionStatus.Active,
    started: meetingStarted.toJSDate(),
    totalMilliseconds,
  })
}

const processMeetingEndedEvent = async (
  event: ChimeEvent<ChimeEventDetail>,
  session: Session
) => {
  const meetingEndedEvent = event.detail as ChimeMeetingEnded
  const meetingStarted = session.started
    ? DateTime.fromJSDate(session.started)
    : undefined
  const meetingEnded = DateTime.fromMillis(meetingEndedEvent.timestamp, {
    zone: 'utc',
  })

  let totalMilliseconds: number | undefined

  if (meetingStarted && meetingEnded) {
    totalMilliseconds = meetingEnded.diff(meetingStarted).milliseconds
  }

  await SessionModel.findByIdAndUpdate(session.id, {
    currentChimeMeeting: undefined,
    status: SessionStatus.Ended,
    ended: meetingEnded.toJSDate(),
    totalMilliseconds,
  })
}

const processMediaPipelineDeletedEvent = async (
  event: ChimeEvent<ChimeEventDetail>,
  session: Session
) => {
  const systemAccount = await getSystemAccount()
  const mediaPipelineDeletedEvent = event.detail as ChimeMediaPipelineDeleted
  const mediaPipelineIndex = session.chimeMediaCapturePipelines.findIndex(
    (p) => p.MediaPipelineId === mediaPipelineDeletedEvent.mediaPipelineId
  )
  const { fileKey: recordingFileKey } = await processChimeRecording({
    sourceBucket: AWS_CHIME_MEETINGS_RECORDINGS_BUCKET,
    meetingId: mediaPipelineDeletedEvent.meetingId,
    recordingIndex: mediaPipelineIndex,
    targetBucket: AWS_S3_VIDEO_ASSETS_BUCKET,
  })

  const videoFile = new FileTrackerModel({
    fileKey: recordingFileKey,
    bucket: AWS_S3_VIDEO_ASSETS_BUCKET,
    createdBy: systemAccount.id,
  })
  await videoFile.save()

  const video = new VideoModel({
    videoType: VideoType.SessionRecording,
    file: videoFile,
    title: recordingFileKey,
    visibility: VideoVisibility.Unlisted,
    audience: VideoAudience.Everyone,
    madeForKids: false,
    status: VideoStatus.Published,
    createdBy: systemAccount,
  })

  const { thumbnailsKeys } = await getThumbnailsFromVideo({
    bucket: AWS_S3_VIDEO_ASSETS_BUCKET,
    videoFileKey: recordingFileKey,
  })

  const thumbnailPromises = thumbnailsKeys.map(async (fileKey) => {
    const file = new FileTrackerModel({
      fileKey,
      bucket: AWS_S3_VIDEO_ASSETS_BUCKET,
      createdBy: systemAccount,
    })
    await file.save()
    const thumbnailDoc = video.thumbnails.create({
      thumbnailType: VideoThumbnailType.AutoGenerated,
      file,
      createdBy: systemAccount,
    })
    video.thumbnails.push(thumbnailDoc)
  })

  await Promise.all(thumbnailPromises)

  await video.save()

  await SessionModel.findByIdAndUpdate(session.id, {
    $push: { recordings: video },
  })

  queueSessionRecodingAvailableNotification({
    currentUser: systemAccount,
    session,
    video,
  })
}

ChimeEventRouter.post('/', [
  ...requireAuthenticationMiddlewares({
    allowBearerToken: false,
    apiKey: AWS_EVENTS_API_KEY,
  }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appReq = req as AuthenticatedRequest
      const { body } = appReq
      const event = body as unknown as ChimeEvent<ChimeEventDetail>

      console.log('Received Event from Chime:', event.detail.eventType)

      const session = await SessionModel.findById(
        event.detail.externalMeetingId
      )

      if (!session) {
        throw new ApiError('sessionNotFound', ApiErrorCode.NotFound)
      }

      switch (event.detail.eventType) {
        case 'chime:MeetingStarted':
          processMeetingStartedEvent(event, session)
          break
        case 'chime:MeetingEnded':
          processMeetingEndedEvent(event, session)
          break
        case 'chime:MediaPipelineDeleted':
          processMediaPipelineDeletedEvent(event, session)
          break
      }
      res.sendStatus(204)
    } catch (e) {
      next(e)
    }
  },
])

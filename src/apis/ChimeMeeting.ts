import AWS from 'aws-sdk'
import {
  CreateMediaCapturePipelineRequest,
  DeleteMediaCapturePipelineRequest,
} from 'aws-sdk/clients/chime'
import { v4 as uuidv4 } from 'uuid'

import { Env } from 'utils/env'

const AWS_CHIME_MEETINGS_RECORDINGS_BUCKET = Env.getString(
  'AWS_CHIME_MEETINGS_RECORDINGS_BUCKET'
)
const AWS_ACCOUNT_ID = Env.getString('AWS_ACCOUNT_ID')
const AWS_REGION = Env.getString('AWS_REGION')
const AWS_ACCESS_KEY_ID = Env.getString('AWS_ACCESS_KEY_ID')
const AWS_SECRET_ACCESS_KEY = Env.getString('AWS_SECRET_ACCESS_KEY')
const AWS_CHIME_ENDPOINT = Env.getString('AWS_CHIME_ENDPOINT')
const AWS_CHIME_MEETINGS_ENDPOINT = Env.getString('AWS_CHIME_MEETINGS_ENDPOINT')

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

export type CreateChimeMeetingRequest = Omit<
  AWS.ChimeSDKMeetings.CreateMeetingRequest,
  'MediaRegion' | 'ClientRequestToken'
>

export const createChimeMeeting = (request: CreateChimeMeetingRequest) =>
  chimeRegional
    .createMeeting({
      ...request,
      MediaRegion: AWS_REGION,
      ClientRequestToken: uuidv4(),
    })
    .promise()

export const createChimeMeetingAttendee = (
  request: AWS.ChimeSDKMeetings.CreateAttendeeRequest
) => chimeRegional.createAttendee(request).promise()

export const deleteChimeMeeting = (
  request: AWS.ChimeSDKMeetings.DeleteMeetingRequest
) => chimeRegional.deleteMeeting(request).promise()

export const createMediaCapturePipeline = async (
  meetingId: string,
  recordingIndex: number
) => {
  const captureRequest: CreateMediaCapturePipelineRequest = {
    SourceType: 'ChimeSdkMeeting',
    SourceArn: `arn:aws:chime::${AWS_ACCOUNT_ID}:meeting:${meetingId}`,
    SinkType: 'S3Bucket',
    SinkArn: `arn:aws:s3:::${AWS_CHIME_MEETINGS_RECORDINGS_BUCKET}/${meetingId}/${recordingIndex}`,
  }

  return chime.createMediaCapturePipeline(captureRequest).promise()
}

export const deleteMediaCapturePipeline = async (mediaPipelineId: string) => {
  const deleteRequest: DeleteMediaCapturePipelineRequest = {
    MediaPipelineId: mediaPipelineId,
  }

  return chime.deleteMediaCapturePipeline(deleteRequest).promise()
}

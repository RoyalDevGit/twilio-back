import express, { Request, Response, NextFunction } from 'express'
import { AWSError } from 'aws-sdk'
import { DateTime } from 'luxon'
import mongoose, { AnyObject, PipelineStage } from 'mongoose'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

import { processOrder } from 'repositories/order/processOrder'
import { ApiError, ApiErrorCode } from 'utils/error/ApiError'
import {
  Session,
  SessionAttendee,
  SessionAttendeeModel,
  SessionModel,
  SessionStatus,
} from 'models/Session'
import { requireAuthenticationMiddlewares } from 'middleware/authMiddleware'
import { AuthenticatedRequest } from 'interfaces/Express'
import { paginateAggregationPipeline } from 'utils/pagination/paginateAggregationPipeline'
import { User, UserModel } from 'models/User'
import { FileTracker, FileTrackerModel } from 'models/FileTracker'
import { parseQueryStringFromRequest } from 'utils/http/parseQueryStringFromRequest'
import { paramValueAsArray } from 'utils/http/paramValueAsArray'
import { parsePaginationParams } from 'utils/pagination/parsePaginationParams'
import { Expert, ExpertModel } from 'models/Expert'
import {
  isSessionJoinable,
  SessionJoinableResult,
} from 'utils/sessions/isSessionJoinable'
import { sessionPopulationPaths } from 'repositories/session/populateSession'
import {
  Order,
  OrderItem,
  OrderItemType,
  OrderModel,
  OrderPaymentStatus,
  SessionExtensionOrderItem,
} from 'models/Order'
import { isPastSession } from 'utils/sessions/isPastSession'
import { getExpertAvailability } from 'repositories/expert/getExpertAvailability'
import {
  createChimeMeeting,
  createChimeMeetingAttendee,
  createMediaCapturePipeline,
  deleteChimeMeeting,
  deleteMediaCapturePipeline,
} from 'apis/ChimeMeeting'
import {
  MessagingChannel,
  MessagingChannelModel,
} from 'models/MessagingChannel'
import { messagingChannelPopulationPaths } from 'repositories/messaging/channel/populateMessagingChannel'
import { getCurrentSessionExtension } from 'repositories/session/getCurrentSessionExtension'
import {
  SessionExtensionRequest,
  SessionExtensionRequestModel,
  SessionExtensionRequestStatus,
} from 'models/SessionExtensionRequest'
import { emitToSession } from 'sockets/userIO'
import { getSessionById } from 'repositories/session/getSessionById'
import { sessionExtensionRequestPopulationPaths } from 'repositories/session/populateSessionExtensionRequest'
import { SessionDurationOptionModel } from 'models/SessionDurationOption'
import { createOrder } from 'repositories/order/createOrder'
import { calculateSessionPrice } from 'utils/commerce/calculateSessionPrice'
import { checkIfWithinPaymentAuthWindow } from 'utils/commerce/checkIfWithinPaymentAuthWindow'
import { holdOrderFunds } from 'commerceOperations/holdOrderFunds'
import { releaseOrderFunds } from 'commerceOperations/releaseOrderFunds'
import { updateOrder } from 'repositories/order/updateOrder'
import { cancelSessionWithPartialRefund } from 'commerceOperations/cancelSessionWithPartialRefund'
import { checkIfWithinFullRefundCancellationWindow } from 'utils/commerce/checkIfWithinFullRefundCancellationWindow'
import { cancelSessionWithFullRefund } from 'commerceOperations/cancelSessionWithFullRefund'
import { queueCancelledSessionWithFullRefundNotifications } from 'notifications/cancelledSession/SessionCancellationWithFullRefund'
import { queueCancelledSessionWithPartialRefundNotifications } from 'notifications/cancelledSession/SessionCancellationWithPartialRefund'
import { queueCancelledSessionByExpertNotifications } from 'notifications/cancelledSession/SessionCancellationByExpert'
import { queueRescheduledSessionNotifications } from 'notifications/SessionRescheduled'

export const sessionRouterPathPrefix = '/sessions'
export const SessionRouter = express.Router()

interface SessionIdParams {
  sessionId: string
}

const isSessionParticipant = (session: Session, currentUser: User) => {
  const sessionExpert = session.expert as Expert
  const sessionConsumer = session.consumer as User

  return (
    currentUser.id !== sessionExpert.user.id &&
    currentUser.id !== sessionConsumer.id
  )
}

SessionRouter.get('/:sessionId/messaging-channel', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appReq = req as AuthenticatedRequest
      const { user, params } = appReq
      const { sessionId } = params as unknown as SessionIdParams

      const session = await SessionModel.findById(sessionId).populate(
        sessionPopulationPaths
      )

      if (!session) {
        throw new ApiError('sessionNotFound', ApiErrorCode.NotFound)
      }

      if (isSessionParticipant(session, user)) {
        throw new ApiError(
          'onlySessionParticipantsCanInteract',
          ApiErrorCode.Forbidden
        )
      }

      const messagingChannel = await MessagingChannelModel.findOne({
        session: session.id,
      }).populate(messagingChannelPopulationPaths)

      if (!messagingChannel) {
        throw new ApiError('messagingChannelNotFound', ApiErrorCode.NotFound)
      }

      res.status(200).json(messagingChannel)
    } catch (e) {
      next(e)
    }
  },
])

SessionRouter.get('/:sessionId', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appReq = req as AuthenticatedRequest
      const { user, params } = appReq
      const { sessionId } = params as unknown as SessionIdParams

      const session = await getSessionById(sessionId)

      if (!session) {
        throw new ApiError('sessionNotFound', ApiErrorCode.NotFound)
      }

      if (isSessionParticipant(session, user)) {
        throw new ApiError(
          'onlySessionParticipantsCanInteract',
          ApiErrorCode.Forbidden
        )
      }

      res.status(200).json(session)
    } catch (e) {
      next(e)
    }
  },
])

interface JoinInfo {
  session: Session
  attendee: SessionAttendee
}

SessionRouter.post('/:sessionId/join', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appReq = req as AuthenticatedRequest
      const { user, params } = appReq
      const { sessionId } = params as unknown as SessionIdParams

      const session = await getSessionById(sessionId)

      if (!session) {
        throw new ApiError('sessionNotFound', ApiErrorCode.NotFound)
      }

      if (isSessionParticipant(session, user)) {
        throw new ApiError('notAuthorizedToJoinSession', ApiErrorCode.Forbidden)
      }

      const joinableResult = isSessionJoinable(session)
      if (!joinableResult.joinable) {
        throw new ApiError<SessionJoinableResult>(
          'sessionNotAvailableForJoining',
          ApiErrorCode.Forbidden,
          {
            data: joinableResult,
          }
        )
      }

      if (!session.currentChimeMeeting) {
        const meetingResponse = await createChimeMeeting({
          ExternalMeetingId: session.id,
        })
        if (!meetingResponse?.Meeting?.MeetingId) {
          throw new ApiError('errorCreatingChimeMeeting', ApiErrorCode.Unknown)
        }
        session.currentChimeMeeting = meetingResponse.Meeting
        session.chimeMeetings.push(meetingResponse.Meeting)
        session.status = SessionStatus.Active
        session.started = DateTime.utc().toJSDate()
        await session.save()
      }

      const newAttendee = new SessionAttendeeModel({
        session: session.id,
        user: user.id,
      })

      if (!session.currentChimeMeeting?.MeetingId) {
        throw new ApiError('noChimeMeetingFound', ApiErrorCode.Unknown)
      }

      try {
        const attendeeResponse = await createChimeMeetingAttendee({
          MeetingId: session.currentChimeMeeting.MeetingId,
          ExternalUserId: user.id,
        })

        if (!attendeeResponse.Attendee?.AttendeeId) {
          throw new ApiError('errorCreatingChimeAttendee', ApiErrorCode.Unknown)
        }

        newAttendee.chimeAttendee = attendeeResponse.Attendee
        await newAttendee.save()

        const joinInfo: JoinInfo = {
          session,
          attendee: newAttendee,
        }

        res.status(200).json(joinInfo)
      } catch (e) {
        const awsError = e as AWSError
        if (awsError.requestId && awsError.statusCode) {
          if (awsError.statusCode === 404) {
            throw new ApiError(awsError.message, ApiErrorCode.Expired)
          }
        }
        throw e
      }
    } catch (e) {
      next(e)
    }
  },
])

SessionRouter.post('/:sessionId/start-recording', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appReq = req as AuthenticatedRequest
      const { user, params } = appReq
      const { sessionId } = params as unknown as SessionIdParams

      const session = await getSessionById(sessionId)
      if (!session) {
        throw new ApiError('sessionNotFound', ApiErrorCode.NotFound)
      }

      if (isSessionParticipant(session, user)) {
        throw new ApiError(
          'onlySessionParticipantsCanInteract',
          ApiErrorCode.Forbidden
        )
      }

      if (session.currentMediaCapturePipeline) {
        throw new ApiError(
          'sessionIsAlreadyBeingRecorded',
          ApiErrorCode.AlreadyExists
        )
      }

      if (!session.currentChimeMeeting?.MeetingId) {
        throw new ApiError('noChimeMeetingFound', ApiErrorCode.Unknown)
      }

      const recordingIndex = session.chimeMediaCapturePipelines.length

      const captureInfo = await createMediaCapturePipeline(
        session.currentChimeMeeting.MeetingId,
        recordingIndex
      )

      if (!captureInfo.MediaCapturePipeline) {
        throw new ApiError(
          'errorCreatingChimeMediaPipeline',
          ApiErrorCode.Unknown
        )
      }
      session.currentMediaCapturePipeline = captureInfo.MediaCapturePipeline
      session.chimeMediaCapturePipelines.push(captureInfo.MediaCapturePipeline)
      await session.save()
      res.sendStatus(204)
    } catch (e) {
      next(e)
    }
  },
])

SessionRouter.post('/:sessionId/stop-recording', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appReq = req as AuthenticatedRequest
      const { user, params } = appReq
      const { sessionId } = params as unknown as SessionIdParams

      const session = await getSessionById(sessionId)
      if (!session) {
        throw new ApiError('sessionNotFound', ApiErrorCode.NotFound)
      }

      if (isSessionParticipant(session, user)) {
        throw new ApiError(
          'onlySessionParticipantsCanInteract',
          ApiErrorCode.Forbidden
        )
      }

      if (!session.currentMediaCapturePipeline?.MediaPipelineId) {
        throw new ApiError('noChimeMediaPipelineFound', ApiErrorCode.Unknown)
      }

      await deleteMediaCapturePipeline(
        session.currentMediaCapturePipeline.MediaPipelineId
      )
      session.currentMediaCapturePipeline = undefined
      await session.save()

      res.sendStatus(204)
    } catch (e) {
      next(e)
    }
  },
])

SessionRouter.post('/:sessionId/end', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appReq = req as AuthenticatedRequest
      const { user, params } = appReq
      const { sessionId } = params as unknown as SessionIdParams

      const session = await getSessionById(sessionId)
      if (!session) {
        throw new ApiError('sessionNotFound', ApiErrorCode.NotFound)
      }

      if (isSessionParticipant(session, user)) {
        throw new ApiError(
          'onlySessionParticipantsCanInteract',
          ApiErrorCode.Forbidden
        )
      }

      if (!session.currentChimeMeeting?.MeetingId) {
        throw new ApiError('noChimeMeetingFound', ApiErrorCode.Unknown)
      }

      await deleteChimeMeeting({
        MeetingId: session.currentChimeMeeting.MeetingId,
      })

      session.currentChimeMeeting = undefined
      session.status = SessionStatus.Ended
      session.ended = DateTime.utc().toJSDate()
      await session.save()
      res.sendStatus(204)
    } catch (e) {
      next(e)
    }
  },
])

type SessionCancellation = Pick<Session, 'cancellationReason'>

const SessionCancellationSchema = {
  type: 'object',
  properties: {
    cancellationReason: { type: 'string' },
  },
  required: ['cancellationReason'],
  additionalProperties: false,
}

SessionRouter.patch('/:sessionId/cancel', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ajv = new Ajv()
      const appReq = req as AuthenticatedRequest
      const { user, params } = appReq
      const { sessionId } = params as unknown as SessionIdParams
      const cancellationData = appReq.body as SessionCancellation

      ajv.validate(SessionCancellationSchema, cancellationData)

      if (ajv.errors?.length) {
        throw ApiError.fromSchemaValidationErrors(ajv.errors)
      }

      const session = await getSessionById(sessionId)

      if (!session) {
        throw new ApiError('sessionNotFound', ApiErrorCode.NotFound)
      }

      if (isSessionParticipant(session, user)) {
        throw new ApiError(
          'onlySessionParticipantsCanInteract',
          ApiErrorCode.Forbidden
        )
      }

      if (isPastSession(session)) {
        throw new ApiError('cannotCancelPastSession', ApiErrorCode.Forbidden)
      }

      if (session.status !== SessionStatus.NotStarted) {
        throw new ApiError(
          'onlyUnstartedSessionsCanBeCancelled',
          ApiErrorCode.Forbidden
        )
      }

      const sessionStartDate = DateTime.fromJSDate(session.startDate.date)

      const eligibleForFullRefund =
        checkIfWithinFullRefundCancellationWindow(sessionStartDate)

      const sessionExpert = session.expert as Expert

      const isExpert = user.id === sessionExpert.user.id

      if (isExpert) {
        await cancelSessionWithFullRefund(session)
        queueCancelledSessionByExpertNotifications({
          currentUser: user,
          session,
        })
      } else {
        if (eligibleForFullRefund) {
          await cancelSessionWithFullRefund(session)
          queueCancelledSessionWithFullRefundNotifications({
            currentUser: user,
            session,
          })
        } else {
          await cancelSessionWithPartialRefund(session)
          queueCancelledSessionWithPartialRefundNotifications({
            currentUser: user,
            session,
          })
        }
      }

      const updatedSession = await SessionModel.findByIdAndUpdate(
        session.id,
        {
          status: SessionStatus.Cancelled,
          cancelledBy: user.id,
          cancellationReason: cancellationData.cancellationReason,
        },
        {
          new: true,
          runValidators: true,
        }
      ).populate(sessionPopulationPaths)

      res.status(200).json(updatedSession)
    } catch (e) {
      next(e)
    }
  },
])

interface SessionReschedule {
  date: string
  timeSlotId: string
}

const SessionRescheduleSchema = {
  type: 'object',
  properties: {
    date: { type: 'string', format: 'date-time' },
    timeSlotId: { type: 'string' },
  },
  required: ['date', 'timeSlotId'],
  additionalProperties: false,
}

SessionRouter.patch('/:sessionId/reschedule', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ajv = new Ajv()
      addFormats(ajv)
      const appReq = req as AuthenticatedRequest
      const { user, params } = appReq
      const { sessionId } = params as unknown as SessionIdParams
      const rescheduleData = appReq.body as SessionReschedule

      ajv.validate(SessionRescheduleSchema, rescheduleData)

      if (ajv.errors?.length) {
        throw ApiError.fromSchemaValidationErrors(ajv.errors)
      }

      const session = await getSessionById(sessionId)

      if (!session) {
        throw new ApiError('sessionNotFound', ApiErrorCode.NotFound)
      }

      if (isSessionParticipant(session, user)) {
        throw new ApiError(
          'onlySessionParticipantsCanInteract',
          ApiErrorCode.Forbidden
        )
      }

      if (isPastSession(session)) {
        throw new ApiError(
          'cannotReschedulePastSession',
          ApiErrorCode.Forbidden
        )
      }

      if (session.status !== SessionStatus.NotStarted) {
        throw new ApiError(
          'onlyUnstartedSessionsCanBeRescheduled',
          ApiErrorCode.Forbidden
        )
      }

      const newDate = DateTime.fromISO(rescheduleData.date)
      const availability = await getExpertAvailability(
        session.expert as Expert,
        user,
        {
          selectedDuration: session.duration,
          from: newDate.minus({ weeks: 1 }),
          to: newDate.plus({ weeks: 1 }),
          includeAllTimeSlots: true,
        }
      )

      const timeSlot = availability.timeSlots.find(
        (ts) => ts.id === rescheduleData.timeSlotId
      )

      if (!timeSlot) {
        throw new ApiError('timeSlotIsNoLongerAvailable', ApiErrorCode.Expired)
      }

      const { order } = session

      const isWithinPaymentWindow = checkIfWithinPaymentAuthWindow(newDate)
      if (isWithinPaymentWindow) {
        if (order.paymentStatus !== OrderPaymentStatus.Authorized) {
          await holdOrderFunds(order)
        }
      } else {
        if (order.paymentStatus === OrderPaymentStatus.Authorized) {
          await releaseOrderFunds(order)
        }
      }

      const updatedSession = await SessionModel.findByIdAndUpdate(
        session.id,
        {
          'startDate.date': timeSlot.startDate,
          'endDate.date': timeSlot.endDate,
        },
        {
          new: true,
          runValidators: true,
        }
      ).populate(sessionPopulationPaths)

      queueRescheduledSessionNotifications({
        currentUser: user,
        session,
      })

      res.status(200).json(updatedSession)
    } catch (e) {
      next(e)
    }
  },
])

interface GetAttendee extends SessionIdParams {
  chimeAttendeeId: string
}

SessionRouter.get('/:sessionId/attendee/:chimeAttendeeId', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appReq = req as AuthenticatedRequest
      const { user, params } = appReq
      const { sessionId, chimeAttendeeId } = params as unknown as GetAttendee

      const session = await getSessionById(sessionId)
      if (!session) {
        throw new ApiError('sessionNotFound', ApiErrorCode.NotFound)
      }

      if (isSessionParticipant(session, user)) {
        throw new ApiError(
          'onlySessionParticipantsCanInteract',
          ApiErrorCode.Forbidden
        )
      }

      const attendee = await SessionAttendeeModel.findOne({
        'chimeAttendee.AttendeeId': chimeAttendeeId,
      }).populate('user')

      if (!attendee) {
        throw new ApiError('sessionAttendeeNotFound', ApiErrorCode.NotFound)
      }

      res.status(200).json(attendee)
    } catch (e) {
      next(e)
    }
  },
])

interface SessionsQueryParams {
  status: SessionStatus[] | SessionStatus
  from?: string
  to?: string
  minEndDate?: string
}

SessionRouter.get('/', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, query } = appReq
    const { status, from, to, minEndDate } =
      parseQueryStringFromRequest<SessionsQueryParams>(appReq)

    const {
      page,
      limit,
      sort = 'session.startDate.date',
      sortDirection = 'asc',
    } = parsePaginationParams(query)

    let matchQuery: AnyObject = {}
    const consumerOrExpert: AnyObject = [
      { 'session.consumer': new mongoose.Types.ObjectId(user.id) },
    ]

    const expert = await ExpertModel.findOne({ user: user.id })

    if (expert) {
      consumerOrExpert.push({
        'session.expert': new mongoose.Types.ObjectId(expert.id),
      })
    }

    matchQuery = {
      ...matchQuery,
      $or: consumerOrExpert,
    }

    if (from && to) {
      const fromDate = DateTime.fromISO(from).toUTC().toJSDate()
      const toDate = DateTime.fromISO(to).toUTC().toJSDate()
      matchQuery = {
        ...matchQuery,
        'session.startDate.date': {
          $gte: fromDate,
          $lte: toDate,
        },
      }
    } else if (from) {
      const fromDate = DateTime.fromISO(from).toUTC().toJSDate()
      matchQuery = {
        ...matchQuery,
        'session.startDate.date': {
          $gte: fromDate,
        },
      }
    } else if (to) {
      const toDate = DateTime.fromISO(to).toUTC().toJSDate()
      matchQuery = {
        ...matchQuery,
        'session.startDate.date': {
          $lte: toDate,
        },
      }
    }

    if (minEndDate) {
      const minDate = DateTime.fromISO(minEndDate).toUTC().toJSDate()
      matchQuery = {
        ...matchQuery,
        'session.endDate.date': {
          $gte: minDate,
        },
      }
    }

    try {
      const aggregationPipeline: PipelineStage[] = [
        {
          $project: {
            _id: 0.0,
            session: '$$ROOT',
          },
        },
        {
          $match: matchQuery,
        },
        {
          $lookup: {
            localField: 'session.messagingChannel',
            from: 'messagingchannels',
            foreignField: '_id',
            as: 'messagingChannel',
          },
        },
        {
          $unwind: {
            path: '$messagingChannel',
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            localField: 'session.order',
            from: 'orders',
            foreignField: '_id',
            as: 'order',
          },
        },
        {
          $unwind: {
            path: '$order',
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            localField: 'session.consumer',
            from: 'users',
            foreignField: '_id',
            as: 'consumer',
          },
        },
        {
          $unwind: {
            path: '$consumer',
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            localField: 'consumer.profilePicture',
            from: 'filetrackers',
            foreignField: '_id',
            as: 'consumerProfilePicture',
          },
        },
        {
          $unwind: {
            path: '$consumerProfilePicture',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            localField: 'session.expert',
            from: 'experts',
            foreignField: '_id',
            as: 'expert',
          },
        },
        {
          $unwind: {
            path: '$expert',
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            localField: 'expert.bannerImage',
            from: 'filetrackers',
            foreignField: '_id',
            as: 'expertBannerImage',
          },
        },
        {
          $unwind: {
            path: '$expertBannerImage',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            localField: 'expert.user',
            from: 'users',
            foreignField: '_id',
            as: 'expertUser',
          },
        },
        {
          $unwind: {
            path: '$expertUser',
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            localField: 'expertUser.profilePicture',
            from: 'filetrackers',
            foreignField: '_id',
            as: 'expertProfilePicture',
          },
        },
        {
          $unwind: {
            path: '$expertProfilePicture',
            preserveNullAndEmptyArrays: true,
          },
        },
      ]

      if (status) {
        aggregationPipeline.push({
          $match: {
            'session.status': {
              $in: paramValueAsArray(status),
            },
          },
        })
      }

      interface AggregateResult {
        session: Session
        order: Order
        consumer: User
        consumerProfilePicture?: FileTracker
        expert: Expert
        expertBannerImage?: FileTracker
        expertUser: User
        expertProfilePicture?: FileTracker
        messagingChannel: MessagingChannel
      }

      const queryResponse = await paginateAggregationPipeline<
        Session,
        AggregateResult
      >({
        model: SessionModel,
        paginationRequest: {
          page,
          limit,
          sort,
          sortDirection,
        },
        pipeline: aggregationPipeline,
        resultMapper: (result) => {
          const session = new SessionModel(result.session)
          session.order = new OrderModel(result.order)
          session.consumer = new UserModel(result.consumer)
          session.messagingChannel = new MessagingChannelModel(
            result.messagingChannel
          )
          if (result.consumerProfilePicture) {
            session.consumer.profilePicture = new FileTrackerModel(
              result.consumerProfilePicture
            )
          }

          session.expert = new ExpertModel(result.expert)
          session.expert.user = new UserModel(result.expertUser)
          if (result.expertBannerImage) {
            session.expert.bannerImage = new FileTrackerModel(
              result.expertBannerImage
            )
          }
          if (result.expertProfilePicture) {
            session.expert.user.profilePicture = new FileTrackerModel(
              result.expertProfilePicture
            )
          }

          session.messagingChannel.participants =
            session.messagingChannel.participants.map((p) => {
              const userId = p.toString()
              const sessionConsumer = session.consumer as User
              const sessionExpert = session.expert as Expert
              if (sessionConsumer.id === userId) {
                return sessionConsumer
              }
              return sessionExpert.user as User
            })

          return session
        },
      })

      res.status(200).json(queryResponse)
    } catch (e) {
      next(e)
    }
  },
])

SessionRouter.get('/:sessionId/extensions/current', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appReq = req as AuthenticatedRequest
      const { user, params } = appReq
      const { sessionId } = params as unknown as SessionIdParams

      const session = await getSessionById(sessionId)
      if (!session) {
        throw new ApiError('sessionNotFound', ApiErrorCode.NotFound)
      }

      if (isSessionParticipant(session, user)) {
        throw new ApiError(
          'onlySessionParticipantsCanInteract',
          ApiErrorCode.Forbidden
        )
      }

      const joinableResult = isSessionJoinable(session)
      if (!joinableResult.joinable) {
        throw new ApiError<SessionJoinableResult>(
          'onlyActiveSessionsCanBeExtended',
          ApiErrorCode.Forbidden,
          {
            data: joinableResult,
          }
        )
      }

      const currentExtension = await getCurrentSessionExtension(session.id)

      res.status(200).json(currentExtension)
    } catch (e) {
      next(e)
    }
  },
])

SessionRouter.post('/:sessionId/extensions', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appReq = req as AuthenticatedRequest
      const { user, params, body } = appReq
      const { sessionId } = params as unknown as SessionIdParams
      const reqData = body as Partial<SessionExtensionRequest> | undefined

      const session = await getSessionById(sessionId)
      if (!session) {
        throw new ApiError('sessionNotFound', ApiErrorCode.NotFound)
      }

      if (isSessionParticipant(session, user)) {
        throw new ApiError(
          'onlySessionParticipantsCanInteract',
          ApiErrorCode.Forbidden
        )
      }

      const joinableResult = isSessionJoinable(session)
      if (!joinableResult.joinable) {
        throw new ApiError<SessionJoinableResult>(
          'onlyActiveSessionsCanBeExtended',
          ApiErrorCode.Forbidden,
          {
            data: joinableResult,
          }
        )
      }

      const currentExtension = await getCurrentSessionExtension(session.id)

      if (currentExtension) {
        throw new ApiError(
          'onlyOneOngoingSessionExtensionRequestAllowed',
          ApiErrorCode.Forbidden
        )
      }

      const sessionExpert = session.expert as Expert
      const sessionConsumer = session.consumer as User

      if (reqData) {
        if (reqData.duration) {
          if (sessionConsumer.id !== user.id) {
            throw new ApiError(
              'onlyConsumerCanSetSessionExtensionDuration',
              ApiErrorCode.Forbidden
            )
          }
        }

        if (reqData.maxDuration) {
          if (sessionExpert.user.id !== user.id) {
            throw new ApiError(
              'onlyExpertsCanSetSessionExtensionMaxDuration',
              ApiErrorCode.Forbidden
            )
          }
        }
      }

      const newRequest = new SessionExtensionRequestModel({
        session,
        requester: user.id,
        status: SessionExtensionRequestStatus.Requested,
        maxDuration: reqData?.maxDuration,
        duration: reqData?.duration,
      })

      await newRequest.save()
      await newRequest.populate(sessionExtensionRequestPopulationPaths)

      emitToSession(session, 'sessionExtensionCreated', newRequest)
      res.status(201).json(newRequest)
    } catch (e) {
      next(e)
    }
  },
])

const FINAL_EXTENSION_STATUSES = [
  SessionExtensionRequestStatus.Declined,
  SessionExtensionRequestStatus.Withdrawn,
  SessionExtensionRequestStatus.Complete,
]

SessionRouter.patch('/:sessionId/extensions/accept', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appReq = req as AuthenticatedRequest
      const { user, params, body } = appReq
      const { sessionId } = params as unknown as SessionIdParams
      const acceptData = body as Partial<SessionExtensionRequest> | undefined

      const session = await getSessionById(sessionId)
      if (!session) {
        throw new ApiError('sessionNotFound', ApiErrorCode.NotFound)
      }

      if (isSessionParticipant(session, user)) {
        throw new ApiError(
          'onlySessionParticipantsCanInteract',
          ApiErrorCode.Forbidden
        )
      }

      const joinableResult = isSessionJoinable(session)
      if (!joinableResult.joinable) {
        throw new ApiError<SessionJoinableResult>(
          'onlyActiveSessionsCanBeExtended',
          ApiErrorCode.Forbidden,
          {
            data: joinableResult,
          }
        )
      }

      const currentExtension = await getCurrentSessionExtension(session.id)

      if (!currentExtension) {
        throw new ApiError(
          'noOngoingSessionExtensionRequest',
          ApiErrorCode.NotFound
        )
      }

      if (FINAL_EXTENSION_STATUSES.includes(currentExtension.status)) {
        throw new ApiError(
          'sessionExtensionIsInFinalStatus',
          ApiErrorCode.Forbidden
        )
      }

      const requester = currentExtension.requester as User

      if (requester.id === user.id) {
        throw new ApiError(
          'cannotApproveOwnSessionExtensionRequest',
          ApiErrorCode.Forbidden
        )
      }

      const sessionExpert = session.expert as Expert
      const sessionConsumer = session.consumer as User

      if (acceptData) {
        if (acceptData.duration) {
          if (sessionConsumer.id !== user.id) {
            throw new ApiError(
              'onlyConsumerCanSetSessionExtensionDuration',
              ApiErrorCode.Forbidden
            )
          }
          currentExtension.duration = acceptData.duration
        }

        if (acceptData.maxDuration) {
          if (sessionExpert.user.id !== user.id) {
            throw new ApiError(
              'onlyExpertsCanSetSessionExtensionMaxDuration',
              ApiErrorCode.Forbidden
            )
          }
          currentExtension.maxDuration = acceptData.maxDuration
        }
      }

      currentExtension.status = SessionExtensionRequestStatus.Accepted
      currentExtension.replier = user
      await currentExtension.save()

      emitToSession(session, 'sessionExtensionAccepted', currentExtension)
      res.status(200).json(currentExtension)
    } catch (e) {
      next(e)
    }
  },
])

SessionRouter.patch('/:sessionId/extensions/decline', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appReq = req as AuthenticatedRequest
      const { user, params } = appReq
      const { sessionId } = params as unknown as SessionIdParams

      const session = await getSessionById(sessionId)
      if (!session) {
        throw new ApiError('sessionNotFound', ApiErrorCode.NotFound)
      }

      if (isSessionParticipant(session, user)) {
        throw new ApiError(
          'onlySessionParticipantsCanInteract',
          ApiErrorCode.Forbidden
        )
      }

      const joinableResult = isSessionJoinable(session)
      if (!joinableResult.joinable) {
        throw new ApiError<SessionJoinableResult>(
          'onlyActiveSessionsCanBeExtended',
          ApiErrorCode.Forbidden,
          {
            data: joinableResult,
          }
        )
      }

      const currentExtension = await getCurrentSessionExtension(session.id)

      if (!currentExtension) {
        throw new ApiError(
          'noOngoingSessionExtensionRequest',
          ApiErrorCode.NotFound
        )
      }

      if (FINAL_EXTENSION_STATUSES.includes(currentExtension.status)) {
        throw new ApiError(
          'sessionExtensionIsInFinalStatus',
          ApiErrorCode.Forbidden
        )
      }

      const requester = currentExtension.requester as User

      if (requester.id === user.id) {
        throw new ApiError(
          'cannotDeclineOwnSessionExtensionRequest',
          ApiErrorCode.Forbidden
        )
      }

      currentExtension.status = SessionExtensionRequestStatus.Declined
      currentExtension.replier = user
      await currentExtension.save()

      emitToSession(session, 'sessionExtensionDeclined', currentExtension)
      res.status(200).json(currentExtension)
    } catch (e) {
      next(e)
    }
  },
])

SessionRouter.patch('/:sessionId/extensions/withdraw', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appReq = req as AuthenticatedRequest
      const { user, params } = appReq
      const { sessionId } = params as unknown as SessionIdParams

      const session = await getSessionById(sessionId)
      if (!session) {
        throw new ApiError('sessionNotFound', ApiErrorCode.NotFound)
      }

      if (isSessionParticipant(session, user)) {
        throw new ApiError(
          'onlySessionParticipantsCanInteract',
          ApiErrorCode.Forbidden
        )
      }

      const joinableResult = isSessionJoinable(session)
      if (!joinableResult.joinable) {
        throw new ApiError<SessionJoinableResult>(
          'onlyActiveSessionsCanBeExtended',
          ApiErrorCode.Forbidden,
          {
            data: joinableResult,
          }
        )
      }

      const currentExtension = await getCurrentSessionExtension(session.id)

      if (!currentExtension) {
        throw new ApiError(
          'noOngoingSessionExtensionRequest',
          ApiErrorCode.NotFound
        )
      }

      if (FINAL_EXTENSION_STATUSES.includes(currentExtension.status)) {
        throw new ApiError(
          'sessionExtensionIsInFinalStatus',
          ApiErrorCode.Forbidden
        )
      }

      const requester = currentExtension.requester as User

      if (requester.id !== user.id) {
        throw new ApiError(
          'cannotWithdrawAnothersExtensionRequest',
          ApiErrorCode.Forbidden
        )
      }

      currentExtension.status = SessionExtensionRequestStatus.Withdrawn
      await currentExtension.save()

      emitToSession(session, 'sessionExtensionWithdrawn', currentExtension)
      res.status(200).json(currentExtension)
    } catch (e) {
      next(e)
    }
  },
])

interface ProcessExtensionBody {
  paymentMethodId: string
  duration: number
}

const ProcessExtensionBodySchema = {
  type: 'object',
  properties: {
    paymentMethodId: { type: 'string' },
    duration: { type: 'integer' },
  },
  required: ['paymentMethodId', 'duration'],
  additionalProperties: false,
}

SessionRouter.post('/:sessionId/extensions/process', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ajv = new Ajv()
      const appReq = req as AuthenticatedRequest
      const { user, params, body } = appReq
      const { sessionId } = params as unknown as SessionIdParams
      const processData = body as ProcessExtensionBody | undefined

      if (!processData) {
        throw new ApiError(
          'missingSessionExtensionProcessData',
          ApiErrorCode.NotFound
        )
      }

      ajv.validate(ProcessExtensionBodySchema, processData)

      if (ajv.errors?.length) {
        throw ApiError.fromSchemaValidationErrors(ajv.errors)
      }

      const session = await getSessionById(sessionId)
      if (!session) {
        throw new ApiError('sessionNotFound', ApiErrorCode.NotFound)
      }

      if (isSessionParticipant(session, user)) {
        throw new ApiError(
          'onlySessionParticipantsCanInteract',
          ApiErrorCode.Forbidden
        )
      }

      const joinableResult = isSessionJoinable(session)
      if (!joinableResult.joinable) {
        throw new ApiError<SessionJoinableResult>(
          'onlyActiveSessionsCanBeExtended',
          ApiErrorCode.Forbidden,
          {
            data: joinableResult,
          }
        )
      }

      const currentExtension = await getCurrentSessionExtension(session.id)

      if (!currentExtension) {
        throw new ApiError(
          'noOngoingSessionExtensionRequest',
          ApiErrorCode.NotFound
        )
      }

      if (FINAL_EXTENSION_STATUSES.includes(currentExtension.status)) {
        throw new ApiError(
          'sessionExtensionIsInFinalStatus',
          ApiErrorCode.Forbidden
        )
      }

      const expert = session.expert as Expert
      const consumer = session.consumer as User

      if (consumer.id !== user.id) {
        throw new ApiError(
          'onlyConsumerCanPayForExtension',
          ApiErrorCode.Forbidden
        )
      }

      const { duration, paymentMethodId } = processData

      const durationOptions = await SessionDurationOptionModel.find({
        expert: expert.id,
      })

      const foundDuration = durationOptions.find((o) => o.duration === duration)

      if (!foundDuration) {
        throw new ApiError(
          'invalidDurationForSessionExtension',
          ApiErrorCode.BadRequest
        )
      }

      const price = calculateSessionPrice(expert, foundDuration.duration)
      const extensionOrderItem: Partial<OrderItem<SessionExtensionOrderItem>> =
        {
          itemType: OrderItemType.SessionExtension,
          totalPrice: {
            currencyCode: price.currencyCode,
            amount: price.amount,
          },
          data: {
            session: session.id,
            duration: foundDuration.duration,
          },
        }

      let order: Order
      if (currentExtension.order) {
        order = await updateOrder({
          orderId: currentExtension.order as string,
          updateData: {
            parentOrder: session.order,
            paymentMethod: paymentMethodId,
            items: [extensionOrderItem],
          },
        })
      } else {
        order = await createOrder({
          req,
          orderData: {
            parentOrder: session.order,
            paymentMethod: paymentMethodId,
            items: [extensionOrderItem],
          },
        })

        currentExtension.order = order
        await currentExtension.save()
      }

      await currentExtension.save()

      await processOrder(order, user)

      currentExtension.duration = foundDuration.duration
      await currentExtension.save()

      res.status(200).json(currentExtension)
    } catch (e) {
      next(e)
    }
  },
])

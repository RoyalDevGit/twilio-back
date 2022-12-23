import { PassThrough } from 'stream'

import express, { Request, Response, NextFunction } from 'express'
import Ajv from 'ajv'
import mongoose, { PipelineStage, Types } from 'mongoose'
import isJSON from 'validator/lib/isJSON'
import { DateTime } from 'luxon'

import { requireAuthenticationMiddlewares } from 'middleware/authMiddleware'
import { Env } from 'utils/env'
import { assumeRole } from 'apis/AwsSTS'
import { getUuid } from 'utils/uuid/getUuid'
import { listChannelMessages, sendChannelMessage } from 'apis/ChimeMessaging'
import { ApiError, ApiErrorCode, ValidationError } from 'utils/error/ApiError'
import {
  MessagingChannel,
  MessagingChannelModel,
  MessagingChannelStatus,
} from 'models/MessagingChannel'
import { AuthenticatedRequest } from 'interfaces/Express'
import { User, UserModel } from 'models/User'
import { FileTracker, FileTrackerModel } from 'models/FileTracker'
import { paginateAggregationPipeline } from 'utils/pagination/paginateAggregationPipeline'
import { parsePaginationParams } from 'utils/pagination/parsePaginationParams'
import { UserMessagingChannelModel } from 'models/UserMessagingChannel'
import {
  messagingChannelPopulationPaths,
  populateMessagingChannel,
} from 'repositories/messaging/channel/populateMessagingChannel'
import { createChimeUserIfNecessary } from 'utils/messaging/chimeAppInstanceUser'
import { ChannelMessageMetadataModel } from 'models/ChannelMessageMetadata'
import {
  ChannelMessage,
  ChannelMessageEmbeddedMetadata,
} from 'interfaces/ChannelMessage'
import { QueryRequest, QueryResponse } from 'interfaces/Query'
import { parseQueryStringFromRequest } from 'utils/http/parseQueryStringFromRequest'
import { emitToUser } from 'sockets/userIO'
import {
  ExpectedFormField,
  ExpectedFormFile,
  ParsedHttpForm,
} from 'utils/http/form/ParsedHttpForm'
import { messageMetadataPopulationPaths } from 'repositories/messaging/message/populateMessageMetadata'
import { Session, SessionModel } from 'models/Session'

export const messagingRouterPathPrefix = '/messaging'
export const MessagingRouter = express.Router()

const AWS_CHIME_MESSAGING_ROLE_ARN = Env.getString(
  'AWS_CHIME_MESSAGING_ROLE_ARN'
)
const AWS_S3_STORAGE_BUCKET = Env.getString('AWS_S3_STORAGE_BUCKET')
const ATTACHMENT_ONLY_CONTENT = '.'

MessagingRouter.get('/chime-messaging-credentials', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const assumeRoleResponse = await assumeRole({
        RoleArn: AWS_CHIME_MESSAGING_ROLE_ARN,
        RoleSessionName: getUuid(),
      })
      res.status(200).json(assumeRoleResponse.Credentials)
    } catch (e) {
      next(e)
    }
  },
])

export interface QueryChannelsRequest extends QueryRequest {
  status?: MessagingChannelStatus | MessagingChannelStatus[]
  onlyStarted?: boolean
}

MessagingRouter.get('/channels', [
  ...requireAuthenticationMiddlewares({ updateLastSeen: true }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, query } = appReq

    const { onlyStarted } =
      parseQueryStringFromRequest<QueryChannelsRequest>(appReq)

    const {
      page,
      limit,
      sort = 'createdAt',
      sortDirection = 'desc',
    } = parsePaginationParams(query)

    try {
      const aggregationPipeline: PipelineStage[] = [
        {
          $project: {
            _id: 0.0,
            messagingChannel: '$$ROOT',
          },
        },
        {
          $match: {
            'messagingChannel.participants': {
              $in: [new mongoose.Types.ObjectId(user.id)],
            },
          },
        },
        {
          $lookup: {
            localField: 'messagingChannel.participants',
            from: 'users',
            foreignField: '_id',
            as: 'participantUsers',
          },
        },
        {
          $lookup: {
            localField: 'participantUsers.profilePicture',
            from: 'filetrackers',
            foreignField: '_id',
            as: 'participantProfilePictures',
          },
        },
        {
          $lookup: {
            localField: 'messagingChannel._id',
            from: 'sessions',
            foreignField: 'messagingChannel',
            as: 'session',
          },
        },
        {
          $unwind: {
            path: '$session',
            preserveNullAndEmptyArrays: true,
          },
        },
      ]

      if (onlyStarted) {
        aggregationPipeline.push({
          $match: {
            'messagingChannel.lastMessage': {
              $ne: null,
            },
          },
        })
      }

      interface AggregateResult {
        messagingChannel: MessagingChannel
        participantUsers: User[]
        participantProfilePictures: FileTracker[]
        session?: Session
      }

      const queryResponse = await paginateAggregationPipeline<
        MessagingChannel,
        AggregateResult
      >({
        model: MessagingChannelModel,
        paginationRequest: {
          page,
          limit,
          sort,
          sortDirection,
        },
        pipeline: aggregationPipeline,
        resultMapper: (result) => {
          const channel = new MessagingChannelModel(result.messagingChannel)
          if (result.session) {
            channel.session = new SessionModel(result.session)
          }
          channel.participants = channel.participants.map((p) => {
            const user = result.participantUsers.find(
              (u) => u._id.toString() === p.toString()
            )
            const participant = new UserModel(user)
            if (participant.profilePicture) {
              const participantPic =
                participant.profilePicture as Types.ObjectId
              const foundPicture = result.participantProfilePictures.find(
                (pic) => pic._id.toString() === participantPic.toString()
              )
              if (foundPicture) {
                participant.profilePicture = new FileTrackerModel(foundPicture)
              }
            }

            return participant
          })
          return channel
        },
      })

      const channelIds = queryResponse.items.map((c) => c.id)

      const userChannels = await UserMessagingChannelModel.find({
        channel: { $in: channelIds },
        user: user.id,
      })

      queryResponse.items.forEach((channel) => {
        const userChannel = userChannels.find(
          (uc) => uc.channel.toString() === channel.id
        )
        if (userChannel) {
          channel.unreadCount = userChannel.unreadCount
          channel.status = userChannel.status
        }
      })

      res.status(200).json(queryResponse)
    } catch (e) {
      next(e)
    }
  },
])

MessagingRouter.patch('/channels/:channelId/mark-as-read', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appReq = req as AuthenticatedRequest
      const { user, params } = appReq
      const { channelId } = params

      const channel = await MessagingChannelModel.findById(channelId).populate(
        messagingChannelPopulationPaths
      )

      if (!channel) {
        throw new ApiError('messagingChannelNotFound', ApiErrorCode.NotFound)
      }

      const existingUserChannel = await UserMessagingChannelModel.findOne({
        channel: channel.id,
        user: user.id,
      })

      if (existingUserChannel) {
        await UserMessagingChannelModel.findByIdAndUpdate(
          existingUserChannel.id,
          {
            unreadCount: 0,
          }
        )
      } else {
        const newUserChannel = new UserMessagingChannelModel({
          channel: channel.id,
          user: user.id,
          unreadCount: 0,
        })
        await newUserChannel.save()
      }
      channel.unreadCount = 0
      const populatedChannel = await populateMessagingChannel(channel)
      emitToUser(user, 'messagingChannelMarkedAsRead', populatedChannel)
      res.status(200).json(populatedChannel)
    } catch (e) {
      next(e)
    }
  },
])

interface SetStatusData {
  status: MessagingChannelStatus
}

const SetStatusDataSchema = {
  type: 'object',
  properties: {
    status: { type: 'string' },
  },
  required: ['status'],
  additionalProperties: false,
}

MessagingRouter.patch('/channels/:channelId/open-status', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appReq = req as AuthenticatedRequest
      const { user, params } = appReq
      const { channelId } = params
      const setStatusData = appReq.body as SetStatusData | undefined

      if (!setStatusData) {
        throw new ApiError('invalidSetStatusRequest', ApiErrorCode.BadRequest)
      }

      const ajv = new Ajv()
      ajv.validate(SetStatusDataSchema, setStatusData)
      if (ajv.errors?.length) {
        throw ApiError.fromSchemaValidationErrors(ajv.errors)
      }

      const channel = await MessagingChannelModel.findById(channelId).populate(
        messagingChannelPopulationPaths
      )

      if (!channel) {
        throw new ApiError('messagingChannelNotFound', ApiErrorCode.NotFound)
      }

      const existingUserChannel = await UserMessagingChannelModel.findOne({
        channel: channel.id,
        user: user.id,
      })

      if (existingUserChannel) {
        await UserMessagingChannelModel.findByIdAndUpdate(
          existingUserChannel.id,
          {
            status: setStatusData.status,
          }
        )
      } else {
        const newUserChannel = new UserMessagingChannelModel({
          channel: channel.id,
          user: user.id,
          status: setStatusData.status,
        })
        await newUserChannel.save()
      }
      channel.status = setStatusData.status

      const populatedChannel = await populateMessagingChannel(channel)
      res.status(200).json(populatedChannel)
    } catch (e) {
      next(e)
    }
  },
])

interface SendMessageData {
  content: string
}

const SendMessageDataSchema = {
  type: 'object',
  properties: {
    content: { type: 'string' },
  },
  additionalProperties: false,
}

MessagingRouter.post('/channels/:channelId/messages', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appReq = req as AuthenticatedRequest
      const { user, params } = appReq
      const { channelId } = params

      const attachments: FileTracker[] = []

      const onFileUpload = (
        stream: PassThrough,
        formFile: ExpectedFormFile<unknown>
      ) => {
        const file = FileTrackerModel.fromFormFile(formFile, {
          createdBy: user.id,
        })
        file.createdBy = user.id
        attachments.push(file)
        return file.upload(AWS_S3_STORAGE_BUCKET, stream)
      }

      const messageDataField = new ExpectedFormField({
        formName: 'messageData',
        required: true,
        validate: (value) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          if (!isJSON(value as string, { allow_primitives: false })) {
            throw new ValidationError('invalidMessageOptionsJson', {
              path: 'messageData',
              type: 'pattern',
              value,
            })
          }
        },
      })

      const { validationErrors } = await ParsedHttpForm.fromRequest(req, {
        onUpload: onFileUpload,
        expectedFields: [messageDataField],
      })

      if (validationErrors.length) {
        throw new ApiError('updateFormIsNotValid', ApiErrorCode.BadRequest, {
          validationErrors: validationErrors,
        })
      }

      const channel = await MessagingChannelModel.findById(channelId)

      if (!channel) {
        throw new ApiError('messagingChannelNotFound', ApiErrorCode.NotFound)
      }

      if (!messageDataField.value) {
        throw new ApiError('messageDataIsInvalid', ApiErrorCode.BadRequest)
      }

      const sendMessageOptions = JSON.parse(
        messageDataField.value as string
      ) as SendMessageData | undefined
      const ajv = new Ajv()
      ajv.validate(SendMessageDataSchema, sendMessageOptions)
      if (ajv.errors?.length) {
        throw ApiError.fromSchemaValidationErrors(ajv.errors)
      }

      if (!sendMessageOptions) {
        throw new ApiError('messageDataIsInvalid', ApiErrorCode.BadRequest)
      }

      const messageMetadata = new ChannelMessageMetadataModel({
        channel: channel.id,
        content: sendMessageOptions.content,
        sender: user,
        attachments,
      })

      const senderProfilePicture = user.profilePicture as
        | FileTracker
        | undefined

      const attachmentsOnly = !!(
        !sendMessageOptions.content?.trim().length && attachments.length
      )

      const embeddedMetadata: ChannelMessageEmbeddedMetadata = {
        id: messageMetadata.id,
        sender: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePictureKey: senderProfilePicture?.fileKey,
        },
        attachmentCount: attachments.length,
        attachmentsOnly,
      }

      const chimeMessage = await sendChannelMessage({
        ChannelArn: channel.chimeChatChannelArn,
        Content: attachmentsOnly
          ? ATTACHMENT_ONLY_CONTENT
          : sendMessageOptions.content,
        Type: 'STANDARD',
        Persistence: 'PERSISTENT',
        ChimeBearer: user.chimeAppInstanceUserArn as string,
        Metadata: JSON.stringify(embeddedMetadata),
      })

      if (attachments.length) {
        messageMetadata.chimeMessageId = chimeMessage.MessageId
        await messageMetadata.save()
      }

      const message: ChannelMessage = {
        id: chimeMessage.MessageId as string,
        metadataId: messageMetadata.id,
        content: sendMessageOptions.content || ' ',
        sender: embeddedMetadata.sender,
        attachmentCount: embeddedMetadata.attachmentCount,
        attachmentsOnly,
        createdAt: DateTime.now().toUTC().toISO(),
        updatedAt: DateTime.now().toUTC().toISO(),
      }

      await MessagingChannelModel.findByIdAndUpdate(channel.id, {
        lastMessage: message,
      })

      // update user related channel metadata
      const allParticipantIds = channel.participants.map((p) => (p as User).id)
      const otherParticipantIds = allParticipantIds.filter(
        (id) => id !== user.id
      )
      const otherParticipantChannels = await UserMessagingChannelModel.find({
        channel: channel.id,
        user: { $in: otherParticipantIds },
      })

      otherParticipantIds.forEach(async (userId) => {
        const existingUserChannel = otherParticipantChannels.find(
          (c) => c.user.toString() === userId
        )
        if (existingUserChannel) {
          await UserMessagingChannelModel.findByIdAndUpdate(
            existingUserChannel.id,
            {
              $inc: { unreadCount: 1 },
            }
          )
        } else {
          const newUserChannel = new UserMessagingChannelModel({
            channel: channel.id,
            user: userId,
            unreadCount: 1,
          })
          await newUserChannel.save()
        }
      })

      res.status(200).json(message)
    } catch (e) {
      next(e)
    }
  },
])

export interface QueryMessagesRequest extends Pick<QueryRequest, 'limit'> {
  nextToken?: string | null
}

interface QueryMessagesResponse
  extends Pick<
    QueryResponse<ChannelMessage>,
    'items' | 'limit' | 'hasNextPage'
  > {
  nextToken?: string | null
}

MessagingRouter.get('/channels/:channelId/messages', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, query, params } = appReq
    const { channelId } = params

    const { nextToken } =
      parseQueryStringFromRequest<QueryMessagesRequest>(appReq)

    try {
      const channel = await MessagingChannelModel.findById(channelId).populate(
        messagingChannelPopulationPaths
      )

      if (!channel) {
        throw new ApiError('messagingChannelNotFound', ApiErrorCode.NotFound)
      }

      const { limit } = parsePaginationParams(query)

      await createChimeUserIfNecessary(user)
      const chimeMessagesResponse = await listChannelMessages({
        ChimeBearer: user.chimeAppInstanceUserArn as string,
        ChannelArn: channel.chimeChatChannelArn,
        NextToken: nextToken || undefined,
        MaxResults: limit,
      })

      const messages =
        chimeMessagesResponse.ChannelMessages?.map((chimeMessage) => {
          const messageMetadata = JSON.parse(
            chimeMessage.Metadata || '{}'
          ) as ChannelMessageEmbeddedMetadata
          const message: ChannelMessage = {
            id: chimeMessage.MessageId as string,
            metadataId: messageMetadata.id,
            content: chimeMessage.Content || '',
            sender: messageMetadata.sender,
            attachmentCount: messageMetadata.attachmentCount,
            attachmentsOnly: messageMetadata.attachmentsOnly,
            createdAt: DateTime.fromJSDate(
              chimeMessage.CreatedTimestamp as Date
            )
              .toUTC()
              .toISO(),
            updatedAt: DateTime.fromJSDate(
              chimeMessage.LastUpdatedTimestamp as Date
            )
              .toUTC()
              .toISO(),
          }
          return message
        }) || []

      const queryResponse: QueryMessagesResponse = {
        nextToken: chimeMessagesResponse.NextToken,
        items: messages,
        limit,
        hasNextPage: !!chimeMessagesResponse.NextToken,
      }

      res.status(200).json(queryResponse)
    } catch (e) {
      next(e)
    }
  },
])

MessagingRouter.get('/messages/:chimeMessageId', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { params } = appReq
    const { chimeMessageId } = params

    try {
      const messageMetadata = await ChannelMessageMetadataModel.findOne({
        chimeMessageId,
      }).populate(messageMetadataPopulationPaths)

      if (!messageMetadata) {
        throw new ApiError('messageMetadataNotFound', ApiErrorCode.NotFound)
      }

      res.status(200).json(messageMetadata)
    } catch (e) {
      next(e)
    }
  },
])

MessagingRouter.get('/channels/arn/:chimeChatChannelArn', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appReq = req as AuthenticatedRequest
      const { user, params } = appReq
      const { chimeChatChannelArn } = params

      const channel = await MessagingChannelModel.findOne({
        chimeChatChannelArn,
      })

      if (!channel) {
        throw new ApiError('messagingChannelNotFound', ApiErrorCode.NotFound)
      }

      const existingUserChannel = await UserMessagingChannelModel.findOne({
        channel: channel.id,
        user: user.id,
      })

      if (existingUserChannel) {
        channel.unreadCount = existingUserChannel.unreadCount
        channel.status = existingUserChannel.status
      }

      const populatedChannel = await populateMessagingChannel(channel)
      emitToUser(user, 'messagingChannelMarkedAsRead', populatedChannel)
      res.status(200).json(populatedChannel)
    } catch (e) {
      next(e)
    }
  },
])

import express, { NextFunction, Request, Response } from 'express'
import { DateTime } from 'luxon'
import { AnyObject } from 'mongoose'

import { requireAuthenticationMiddlewares } from 'middleware/authMiddleware'
import { AuthenticatedRequest } from 'interfaces/Express'
import { getEnumValues } from 'utils/enum/enumUtils'
import {
  NotificationType,
  NotificationChannel,
  NotificationAudience,
  AllNotificationConfigs,
} from 'models/NotificationConfig'
import { NotificationUserPreferenceModel } from 'models/NotificationUserPreference'
import { getUserNotificationPreference } from 'repositories/notification/getUserNotificationPreference'
import { ApiError, ApiErrorCode } from 'utils/error/ApiError'
import {
  Notification,
  NotificationModel,
  NotificationStatus,
} from 'models/Notification'
import { parsePaginationParams } from 'utils/pagination/parsePaginationParams'
import { parseQueryStringFromRequest } from 'utils/http/parseQueryStringFromRequest'
import { toQueryResponse } from 'utils/pagination/toQueryResponse'
import {
  createTrayNotification,
  TrayNotification,
} from 'utils/notifications/createTrayNotification'
import { paramValueAsArray } from 'utils/http/paramValueAsArray'
import { queueSimpleNotification } from 'notifications/SimpleMessage'
import { notificationPopulationPaths } from 'repositories/notification/notificationPopulationPaths'

export const notificationsRouterPathPrefix = '/notifications'
export const NotificationsRouter = express.Router()

NotificationsRouter.post('/test', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user } = appReq

    try {
      const queuedNotifications = await queueSimpleNotification(user)
      res.status(200).json(queuedNotifications)
    } catch (e) {
      next(e)
    }
  },
])

interface NotificationQueryParams {
  status: NotificationStatus[]
  from?: string
  to?: string
}

NotificationsRouter.get('/', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, query } = appReq
    const paginationRequest = parsePaginationParams(query)

    const { status, from, to } =
      parseQueryStringFromRequest<NotificationQueryParams>(appReq)

    const { sort = 'createdAt', sortDirection = 'asc' } = paginationRequest

    let matchQuery: AnyObject = {
      targetUser: user,
    }
    const trayNotifications: TrayNotification[] = []

    if (status) {
      matchQuery.status = paramValueAsArray(status)
    }

    if (from && to) {
      const fromDate = DateTime.fromISO(from).toUTC().toJSDate()
      const toDate = DateTime.fromISO(to).toUTC().toJSDate()
      matchQuery = {
        ...matchQuery,
        createdAt: {
          $gte: fromDate,
          $lte: toDate,
        },
      }
    } else if (from) {
      const fromDate = DateTime.fromISO(from).toUTC().toJSDate()
      matchQuery = {
        ...matchQuery,
        createdAt: {
          $gte: fromDate,
        },
      }
    } else if (to) {
      const toDate = DateTime.fromISO(to).toUTC().toJSDate()
      matchQuery = {
        ...matchQuery,
        createdAt: {
          $lte: toDate,
        },
      }
    }

    try {
      const paginationResult = await NotificationModel.paginate(
        {
          channel: NotificationChannel.NotificationTray,
          ...matchQuery,
        },
        {
          ...paginationRequest,
          sort: { [sort]: sortDirection === 'asc' ? 1 : -1 },
          populate: notificationPopulationPaths,
        }
      )

      const queryResponse = toQueryResponse(paginationResult)

      for (let i = 0; i < queryResponse.items.length; i++) {
        const notification = queryResponse.items[i]
        const trayNotification = await createTrayNotification(
          user,
          notification
        )
        trayNotifications.push(trayNotification)
      }

      res.status(200).json({ ...queryResponse, items: trayNotifications })
    } catch (e) {
      next(e)
    }
  },
])

interface MarkNotificationsAsReadPayload {
  notificationIds: string[]
}

NotificationsRouter.post('/mark-as-read', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const payload = appReq.body as MarkNotificationsAsReadPayload | undefined

    try {
      if (!payload?.notificationIds?.length) {
        throw new ApiError('noNotificationIdsProvided', ApiErrorCode.BadRequest)
      }

      const updatedNotificaton: Partial<Notification> = {}

      updatedNotificaton.status = NotificationStatus.Read
      await NotificationModel.updateMany(
        {
          _id: { $in: payload.notificationIds },
          status: NotificationStatus.Sent,
          channel: NotificationChannel.NotificationTray,
        },
        { status: NotificationStatus.Read },
        {
          runValidators: true,
        }
      )
      res.sendStatus(204)
    } catch (e) {
      next(e)
    }
  },
])

interface UserNotificationPreference {
  id: NotificationType
  audience: NotificationAudience
  allowOptOut: boolean
  availableChannels: NotificationChannel[]
  userChannels: NotificationChannel[]
}

NotificationsRouter.get('/preferences', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user } = appReq

    try {
      const userNotificationPreferences: UserNotificationPreference[] =
        await Promise.all(
          AllNotificationConfigs.map(async (config) => {
            const userNotificationPref: UserNotificationPreference = {
              id: config.id,
              audience: config.audience,
              allowOptOut: config.allowOptOut,
              availableChannels: config.getChannels(),
              userChannels: await getUserNotificationPreference(user, config),
            }
            return userNotificationPref
          })
        )

      res.status(200).json(userNotificationPreferences)
    } catch (e) {
      next(e)
    }
  },
])

interface PreferenceBody {
  notificationType: NotificationType
  userChannels: NotificationChannel[]
}

NotificationsRouter.patch('/', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, body } = appReq
    const { userChannels, notificationType } = body as PreferenceBody

    try {
      if (
        !getEnumValues(NotificationType).includes(
          notificationType as NotificationType
        )
      ) {
        throw new ApiError('notificationNotFound', ApiErrorCode.BadRequest)
      }

      const existingPreference = await NotificationUserPreferenceModel.findOne({
        userId: user.id,
        notificationType,
      })

      if (!existingPreference) {
        const newNotificationPreference = new NotificationUserPreferenceModel({
          userId: user.id,
          notificationType,
          channels: userChannels,
        })
        newNotificationPreference.save()
      } else {
        await NotificationUserPreferenceModel.findByIdAndUpdate(
          existingPreference._id,
          { channels: userChannels },
          {
            new: true,
            runValidators: true,
          }
        )
      }

      res.status(200).json({ notificationType, userChannels })
    } catch (e) {
      next(e)
    }
  },
])

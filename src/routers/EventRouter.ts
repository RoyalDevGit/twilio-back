import express, { Request, Response, NextFunction } from 'express'
import { DateTime } from 'luxon'

import { requireAuthenticationMiddlewares } from 'middleware/authMiddleware'
import { AuthenticatedRequest } from 'interfaces/Express'
import { EventModel, Event } from 'models/Event'
import { EventReservationModel } from 'models/EventReservation'
import { getRecurringEventInstances } from 'repositories/event/getRecurringEventInstances'
import { ApiError, ApiErrorCode } from 'utils/error/ApiError'

export const eventRouterPathPrefix = '/events'
export const EventRouter = express.Router()

interface GetEventParams {
  eventId: string
}

EventRouter.get('/:eventId', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { params } = appReq
    const { eventId } = params as unknown as GetEventParams

    try {
      const event = await EventModel.findById(eventId)
      if (!event) {
        throw new ApiError('eventNotFound', ApiErrorCode.NotFound)
      }

      res.status(200).json(event)
    } catch (e) {
      next(e)
    }
  },
])

EventRouter.patch('/:eventId', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { params, body } = appReq
    const { eventId } = params as unknown as GetEventParams
    const updateData = body as Event

    try {
      const event = await EventModel.findById(eventId)
      if (!event) {
        throw new ApiError('eventNotFound', ApiErrorCode.NotFound)
      }

      const updatedEvent = await EventModel.findByIdAndUpdate(
        eventId,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      )

      res.status(200).json(updatedEvent)
    } catch (e) {
      next(e)
    }
  },
])

EventRouter.delete('/:eventId', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { params } = appReq
    const { eventId } = params as unknown as GetEventParams

    try {
      const event = await EventModel.findById(eventId)
      if (!event) {
        throw new ApiError('eventNotFound', ApiErrorCode.NotFound)
      }

      await event.delete()

      res.sendStatus(204)
    } catch (e) {
      next(e)
    }
  },
])

interface CreateReservationBody {
  user?: string
  eventInstanceStartDate?: string
}

EventRouter.post('/:eventId/reservations', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, params, body } = appReq
    const { eventId } = params as unknown as GetEventParams
    const { eventInstanceStartDate, user: targetUser } =
      body as CreateReservationBody

    const reservationUser = targetUser || user.id

    try {
      const existingEvents = await EventModel.find({
        $or: [{ id: eventId }, { parentEvent: eventId }],
      })
      const parentEvent = existingEvents.find((e) => !e.instanceId)

      if (!parentEvent) {
        throw new ApiError('eventNotFound', ApiErrorCode.NotFound)
      }

      const existingReservationOnParent = await EventReservationModel.findOne({
        event: parentEvent,
        user: reservationUser,
      })

      if (existingReservationOnParent) {
        res
          .status(409)
          .json(
            new ApiError(
              'reservationAlreadyExistsOnParent',
              ApiErrorCode.AlreadyExists
            )
          )
        return
      }

      let targetEvent: Event
      if (eventInstanceStartDate) {
        const eventInstances = existingEvents.filter((e) => e.instanceId)
        const instanceStartDate = DateTime.fromISO(eventInstanceStartDate)
        const existingInstance = eventInstances.find((e) =>
          DateTime.fromJSDate(e.originalStartDate.date).equals(
            instanceStartDate
          )
        )
        if (existingInstance) {
          targetEvent = existingInstance
        } else {
          const [eventInstance] = getRecurringEventInstances(parentEvent, {
            from: instanceStartDate,
            to: instanceStartDate,
          })
          if (!eventInstance) {
            throw new ApiError('eventInstanceNotFound', ApiErrorCode.NotFound)
          }
          await eventInstance.save()
          targetEvent = eventInstance
        }
      } else {
        targetEvent = parentEvent
      }

      const existingReservation = await EventReservationModel.findOne({
        event: targetEvent,
        user: reservationUser,
      })

      if (existingReservation) {
        res
          .status(409)
          .json(
            new ApiError('reservationAlreadyExists', ApiErrorCode.AlreadyExists)
          )
        return
      }

      const newReservation = new EventReservationModel({
        user: reservationUser,
        event: targetEvent,
      })

      newReservation.createdBy = user._id
      await newReservation.save()

      res.status(201).json(newReservation)
    } catch (e) {
      next(e)
    }
  },
])

interface DeleteReservationParams {
  eventId: string
  reservationId: string
}

EventRouter.delete('/:eventId/reservations/:reservationId', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { params } = appReq
    const { eventId, reservationId } =
      params as unknown as DeleteReservationParams

    try {
      const existingReservation = await EventReservationModel.findOne({
        id: reservationId,
        event: eventId,
      })
      if (!existingReservation) {
        throw new ApiError('eventReservationNotFound', ApiErrorCode.NotFound)
      }

      await existingReservation.delete()

      res.sendStatus(204)
    } catch (e) {
      next(e)
    }
  },
])

EventRouter.get('/:eventId/reservations', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { params } = appReq
    const { eventId } = params as unknown as GetEventParams

    try {
      const event = await EventModel.findById(eventId)
      if (!event) {
        throw new ApiError('eventNotFound', ApiErrorCode.NotFound)
      }

      const reservations = await EventReservationModel.find({
        event: event._id,
      })

      res.status(200).json(reservations)
    } catch (e) {
      next(e)
    }
  },
])

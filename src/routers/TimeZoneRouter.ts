import express, { Request, Response, NextFunction } from 'express'
import { getTimeZones } from '@vvo/tzdb'

import { requireAuthenticationMiddlewares } from 'middleware/authMiddleware'
import { ApiError, ApiErrorCode } from 'utils/error/ApiError'
import { parseParamsFromRequest } from 'utils/http/parseParamsFromRequest'

export const timeZoneRouterPathPrefix = '/time-zones'
export const TimeZoneRouter = express.Router()

interface GetTimeZoneParams {
  timeZoneName: string
}

TimeZoneRouter.get('/', [
  ...requireAuthenticationMiddlewares(),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const timeZones = getTimeZones()
      res.status(200).json(timeZones)
    } catch (e) {
      next(e)
    }
  },
])

TimeZoneRouter.get('/:timeZoneName', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { timeZoneName } = parseParamsFromRequest<GetTimeZoneParams>(req)

    try {
      if (!timeZoneName) {
        throw new ApiError('noTimeZoneNameWasProvided', ApiErrorCode.BadRequest)
      }

      const tzName = timeZoneName.toLowerCase().trim()
      const timeZone = getTimeZones().find(
        (tz) => tz.name.toLowerCase() === tzName
      )

      if (!timeZone) {
        throw new ApiError('timeZoneNotFound', ApiErrorCode.NotFound)
      }

      res.status(200).json(timeZone)
    } catch (e) {
      next(e)
    }
  },
])

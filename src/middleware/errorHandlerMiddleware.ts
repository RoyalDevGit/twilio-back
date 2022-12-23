import { Request, Response, NextFunction } from 'express'

import { AppRequest } from 'interfaces/Express'
import { inProduction } from 'utils/env'
import { ApiError, convertErrorCodeToHttpCode } from 'utils/error/ApiError'
import { noticeError } from 'utils/newrelic/newrelic-utils'

export const errorHandlerMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { t } = req as AppRequest
  noticeError(err)
  console.log('errorHandlerMiddleware error', err)
  const apiError = ApiError.fromError(err)
  if (inProduction) {
    apiError.stack = undefined
  }

  apiError.message = t(apiError.message)
  res.status(convertErrorCodeToHttpCode(apiError.code)).json(apiError)
  next()
}

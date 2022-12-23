import express, { Request, Response, NextFunction } from 'express'
import { JsonWebTokenError } from 'jsonwebtoken'

import { requireAuthenticationMiddlewares } from 'middleware/authMiddleware'
import { ApiErrorCode, ApiError } from 'utils/error/ApiError'
import { verifyActionToken } from 'utils/token/actionToken'
import { ActionTokenType } from 'enums/ActionTokenType'
import { AppRequest } from 'interfaces/Express'

export const actionRouterPathPrefix = '/actions'
export const ActionRouter = express.Router()

ActionRouter.post('/', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AppRequest
    const { body } = appReq
    const { actionToken } = body
    try {
      const actionTokenData = verifyActionToken(actionToken)
      switch (actionTokenData.type) {
        case ActionTokenType.EmailVerification:
          break
      }
    } catch (e) {
      const jwtError = e as JsonWebTokenError
      if (jwtError.name === 'TokenExpiredError') {
        res
          .status(410)
          .json(new ApiError('expiredActionToken', ApiErrorCode.Expired))
        return
      }
      next(e)
    }
  },
])

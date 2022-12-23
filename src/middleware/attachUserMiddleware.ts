import { Request, Response, NextFunction } from 'express'
import { expressjwt } from 'express-jwt'

import { Env } from 'utils/env'
import { UserModel } from 'models/User'
import { AppRequest } from 'interfaces/Express'
import { ApiError, ApiErrorCode } from 'utils/error/ApiError'
import { getUserById } from 'repositories/user/getUserById'
import { updateUserLastSeen } from 'repositories/user/updateUserLastSeen'

const JWT_SECRET = Env.getString('JWT_SECRET')
const JWT_COOKIE = Env.getString('JWT_COOKIE')

export interface AuthenticationOptions {
  allowBearerToken?: boolean
  updateLastSeen?: boolean
}

export const attachUserMiddleware = ({
  allowBearerToken = true,
  updateLastSeen,
}: AuthenticationOptions = {}) => [
  expressjwt({
    algorithms: ['HS256'],
    secret: JWT_SECRET,
    requestProperty: 'jwt',
    credentialsRequired: false,
    getToken: (req: Request) => {
      if (!allowBearerToken) {
        return
      }
      const appReq = req as AppRequest
      const authorizationHeader = appReq.get('authorization')
      if (
        authorizationHeader &&
        authorizationHeader.toLowerCase().startsWith('bearer')
      ) {
        const bearerToken = authorizationHeader.split(' ')[1]
        return bearerToken
      }
      if (!appReq.cookies[JWT_COOKIE]) {
        return
      }
      return appReq.cookies[JWT_COOKIE]
    },
  }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AppRequest
    if (appReq.user) {
      next()
      return
    }
    if (appReq.jwt?.id) {
      const user = await getUserById(appReq.jwt.id)
      if (!user) {
        next(new ApiError('notAuthorized', ApiErrorCode.NotAuthorized))
        return
      }
      appReq.user = new UserModel(user)
      if (updateLastSeen) {
        updateUserLastSeen(appReq.user)
      }
      next()
      return
    }

    next()
  },
]

import { Request, Response, NextFunction } from 'express'
import { expressjwt } from 'express-jwt'
import jwt from 'jsonwebtoken'
import cookie from 'cookie'

import { Env } from 'utils/env'
import { User, UserModel } from 'models/User'
import { AppRequest } from 'interfaces/Express'
import { ApiError, ApiErrorCode } from 'utils/error/ApiError'
import { AppSocketIORequest } from 'interfaces/AppSocketIORequest'
import { SocketIOMiddleware } from 'interfaces/SocketIOMiddleware'
import { getUserById } from 'repositories/user/getUserById'
import { getSystemAccount } from 'repositories/user/getSystemAccount'
import { updateUserLastSeen } from 'repositories/user/updateUserLastSeen'

const JWT_SECRET = Env.getString('JWT_SECRET')
const JWT_COOKIE = Env.getString('JWT_COOKIE')

export interface AuthenticationOptions {
  allowBearerToken?: boolean
  apiKeyHeaderName?: string
  apiKey?: string
  updateLastSeen?: boolean
}

export const requireAuthenticationMiddlewares = ({
  allowBearerToken = true,
  apiKeyHeaderName = 'X-API-KEY',
  apiKey,
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
    if (appReq.jwt?.id || !apiKey) {
      next()
      return
    }
    const apiKeyValue = appReq.get(apiKeyHeaderName)
    if (!apiKeyValue || apiKeyValue !== apiKey) {
      next(new ApiError('notAuthorized', ApiErrorCode.NotAuthorized))
    }
    const systemAccount = await getSystemAccount()
    appReq.user = systemAccount
    next()
  },
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AppRequest
    if (appReq.user) {
      next()
      return
    }
    if (!appReq.jwt?.id) {
      next(new ApiError('notAuthorized', ApiErrorCode.NotAuthorized))
      return
    }
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
  },
]

export const socketAuthMiddleware: SocketIOMiddleware = async (
  socket,
  next
) => {
  const appReq = socket.request as AppSocketIORequest
  const authorizationHeader = appReq.headers['authorization']
  let token: string | undefined
  if (appReq.headers.cookie) {
    const cookies = cookie.parse(appReq.headers.cookie)
    token = cookies[JWT_COOKIE]
  }

  if (
    authorizationHeader &&
    authorizationHeader.toLowerCase().startsWith('bearer')
  ) {
    token = authorizationHeader.split(' ')[1]
  }
  if (!token) {
    next(new ApiError('notAuthorized', ApiErrorCode.NotAuthorized))
    return
  }
  try {
    const jwtUser = jwt.verify(token, JWT_SECRET) as User
    const user = await UserModel.findById(jwtUser.id)
    if (!user) {
      next(new ApiError('userNotFound', ApiErrorCode.Expired))
      return
    }
    appReq.user = user
    next()
  } catch (e) {
    next(new ApiError('invalidToken', ApiErrorCode.Expired))
    return
  }
}

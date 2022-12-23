import express from 'express'
import { Strategy } from 'passport-microsoft'

import { Env } from 'utils/env'
import { UserRole } from 'models/User'
import { OAuthDevice, OAuthProvider, OAuthType } from 'interfaces/OAuth'
import {
  attachProviderRoutes,
  generateCallBackUrl,
  generateOAuthBodyCallback,
} from 'utils/oAuth/oAuthUtils'

export const MicrosoftOAuthRouter = express.Router()
export const microsoftOAuthRouterPathPrefix = '/oauth/microsoft'

const MICROSOFT_CLIENT_ID = Env.getString('MICROSOFT_CLIENT_ID')
const MICROSOFT_CLIENT_SECRET = Env.getString('MICROSOFT_CLIENT_SECRET')

const generateStrategy = (
  role: UserRole,
  path: OAuthType,
  device: OAuthDevice
) =>
  new Strategy(
    {
      clientID: MICROSOFT_CLIENT_ID,
      clientSecret: MICROSOFT_CLIENT_SECRET,
      callbackURL: generateCallBackUrl(
        path,
        role,
        OAuthProvider.Microsoft,
        device
      ),
      scope: ['user.read'],
      passReqToCallback: true,
    },
    generateOAuthBodyCallback(role, path, OAuthProvider.Microsoft)
  )

if (MICROSOFT_CLIENT_ID && MICROSOFT_CLIENT_SECRET) {
  attachProviderRoutes(
    OAuthProvider.Microsoft,
    MicrosoftOAuthRouter,
    generateStrategy
  )
}

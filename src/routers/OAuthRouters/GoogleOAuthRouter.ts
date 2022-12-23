import express from 'express'
import { Strategy } from 'passport-google-oauth20'

import { Env } from 'utils/env'
import { UserRole } from 'models/User'
import {
  attachProviderRoutes,
  generateCallBackUrl,
  generateOAuthBodyCallback,
} from 'utils/oAuth/oAuthUtils'
import { OAuthDevice, OAuthProvider, OAuthType } from 'interfaces/OAuth'

export const GoogleOAuthRouter = express.Router()
export const googleOAuthRouterPathPrefix = '/oauth/google'

const GOOGLE_CLIENT_ID = Env.getString('GOOGLE_CLIENT_ID')
const GOOGLE_CLIENT_SECRET = Env.getString('GOOGLE_CLIENT_SECRET')

const generateStrategy = (
  role: UserRole,
  path: OAuthType,
  device: OAuthDevice
) =>
  new Strategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: generateCallBackUrl(
        path,
        role,
        OAuthProvider.Google,
        device
      ),
      scope: ['email', 'profile'],
      passReqToCallback: true,
    },
    generateOAuthBodyCallback(role, path, OAuthProvider.Google)
  )

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  attachProviderRoutes(
    OAuthProvider.Google,
    GoogleOAuthRouter,
    generateStrategy
  )
}

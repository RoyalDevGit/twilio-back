import express from 'express'
import { Strategy } from 'passport-facebook'

import { Env } from 'utils/env'
import { UserRole } from 'models/User'
import {
  attachProviderRoutes,
  generateCallBackUrl,
  generateOAuthBodyCallback,
} from 'utils/oAuth/oAuthUtils'
import { OAuthDevice, OAuthProvider, OAuthType } from 'interfaces/OAuth'

export const FacebookOAuthRouter = express.Router()
export const facebookOAuthRouterPathPrefix = '/oauth/facebook'

const FACEBOOK_CLIENT_ID = Env.getString('FACEBOOK_CLIENT_ID')
const FACEBOOK_CLIENT_SECRET = Env.getString('FACEBOOK_CLIENT_SECRET')

const getStrategy = (role: UserRole, path: OAuthType, device: OAuthDevice) =>
  new Strategy(
    {
      clientID: FACEBOOK_CLIENT_ID,
      clientSecret: FACEBOOK_CLIENT_SECRET,
      callbackURL: generateCallBackUrl(
        path,
        role,
        OAuthProvider.Facebook,
        device
      ),
      profileFields: ['email', 'name', 'displayName', 'picture'],
      passReqToCallback: true,
    },
    generateOAuthBodyCallback(role, path, OAuthProvider.Facebook)
  )

if (FACEBOOK_CLIENT_ID && FACEBOOK_CLIENT_SECRET) {
  attachProviderRoutes(OAuthProvider.Facebook, FacebookOAuthRouter, getStrategy)
}

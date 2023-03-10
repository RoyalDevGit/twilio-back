import express from 'express'
import passport from 'passport'

import { authenticate2FA_Code } from 'utils/oAuth/oAuthUtils'

export const SharedOAuthRouter = express.Router()
export const sharedOAuthRouterPathPrefix = '/oauth'

/**
 * This endpoint will be called when the user has 2FA enabled and they
 * log in or sign up with an OAuth provider
 */
SharedOAuthRouter.post('/login/2fa', [authenticate2FA_Code])

/**
 * Configure Passport authenticated session persistence.
 * In order to restore authentication state across HTTP requests, Passport needs
 * to serialize users into and deserialize users out of the session.
 * In aproduction-quality application, this would typically be as simple as
 * supplying the user ID when serializing, and querying the user record by ID
 * from the database when deserializing.  However, due to the fact that this
 * example does not have a database, the complete Facebook profile is serialized
 * and deserialized.
 */
passport.serializeUser(function (user, cb) {
  cb(null, user)
})

/**
 * We are currently not deserializing users
 */
// passport.deserializeUser(function (obj:any, cb) {
//   cb(null, obj)
// })

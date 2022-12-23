import fs from 'fs'

import AppleStrategy, {
  DecodedIdToken,
  Profile,
  VerifyCallback,
} from 'passport-apple'
import express, { Request } from 'express'
import jwt from 'jsonwebtoken'

import { Env } from 'utils/env'
import { ApiErrorCode, ApiError } from 'utils/error/ApiError'
import { UserRole } from 'models/User'
import {
  attachProviderRoutes,
  createOrFetchUserFromOAuthProfile,
  generateCallBackUrl,
  get2FAResults,
} from 'utils/oAuth/oAuthUtils'
import { OAuthDevice, OAuthProvider, OAuthType } from 'interfaces/OAuth'

export const AppleOAuthRouter = express.Router()
export const appleOAuthRouterPathPrefix = '/oauth/apple'

const APPLE_CLIENT_ID = Env.getString('APPLE_CLIENT_ID')
const APPLE_TEAM_ID = Env.getString('APPLE_TEAM_ID')
const APPLE_KEY_ID = Env.getString('APPLE_KEY_ID')
const APPLE_KEY_VALUE = Env.getString('APPLE_KEY_VALUE')

/**
 * The passport strat for Apple passes in an additional parameter idToken
 * and therefore has to be a different callback method from the other providers
 * @param role
 * @param path
 * @returns
 */

const getStrategy = (role: UserRole, path: OAuthType, device: OAuthDevice) =>
  new AppleStrategy(
    {
      clientID: APPLE_CLIENT_ID,
      teamID: APPLE_TEAM_ID,
      callbackURL: generateCallBackUrl(path, role, OAuthProvider.Apple, device),
      keyID: APPLE_KEY_ID,
      scope: 'email name',
      privateKeyLocation: 'apple-key.p8',
      passReqToCallback: true,
    },
    async function (
      req: Request,
      accessToken: string,
      refreshToken: string,
      idToken: DecodedIdToken,
      _profile: Profile,
      cb: VerifyCallback
    ) {
      try {
        // the passport-apple package cast idToken as a DecodedIdToken; however, it comes in as a string
        const decodeObject = jwt.decode(idToken as unknown as string) as Profile
        const profile: Partial<Profile> = {
          emails: [
            {
              value: decodeObject.email,
            },
          ],
        }
        // Require email to be passed in from the OAuth Profile...
        const emailAddress: string = decodeObject.email || ''
        if (!emailAddress) {
          throw new ApiError('emailRequired', ApiErrorCode.BadRequest)
        }
        /**
         * Next, we want to fetch or create our user.
         * Whether they log in or sign up, they will be created in the database...
         */
        const user = await createOrFetchUserFromOAuthProfile(profile, {
          oAuthSettings: {
            accessToken,
            refreshToken,
            provider: OAuthProvider.Apple,
          },
          roles: [role],
        })
        /**
         * If user has 2FA enabled, then trigger a promp once they are authenticated and pass a tmp token back to them
         * They will use that same token to re-authenticate once the MFA code comes in
         */
        const twoFactorError = await get2FAResults(user, req)
        if (twoFactorError) {
          throw twoFactorError
        }
        return cb(null, user)
      } catch (e) {
        return cb(e as Error)
      }
    }
  )

if (APPLE_CLIENT_ID && APPLE_TEAM_ID && APPLE_KEY_ID && APPLE_KEY_VALUE) {
  try {
    const dir = 'apple-key.p8'
    /**
     * Apple expects the certificate key to be on the local file system.
     * We simply write from the environment variable to the file system
     * if one does not exist.
     */
    if (!fs.existsSync(dir)) {
      const bufferValue = Buffer.from(APPLE_KEY_VALUE, 'base64')
      const asciiValue = bufferValue.toString('ascii')
      fs.writeFile(dir, asciiValue, (err) => {
        if (err) console.error(err)
      })
    }
    attachProviderRoutes(OAuthProvider.Apple, AppleOAuthRouter, getStrategy)
  } catch (e) {
    console.error(e)
  }
}

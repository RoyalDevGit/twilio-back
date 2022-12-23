import { Request, Response, Router, NextFunction } from 'express'
import mime from 'mime'
import passport, { Profile } from 'passport'
import { DateTime } from 'luxon'
import { AnyObject } from 'mongoose'

import { AppRequest, AuthenticatedRequest } from 'interfaces/Express'
import {
  OAuthResponse,
  OAuthDevice,
  OAuthProvider,
  OAuthType,
} from 'interfaces/OAuth'
import { FileTracker, FileTrackerModel } from 'models/FileTracker'
import { TwoFactorAuthMethod, User, UserModel, UserRole } from 'models/User'
import { isValidAuthCode, sendSMSAuthCode } from 'utils/2FA/authenticator'
import { createTokenResponse, TokenResponse, verifyToken } from 'utils/auth/jwt'
import { Env } from 'utils/env'
import { ApiError, ApiErrorCode } from 'utils/error/ApiError'
import { validatePhoneNumber } from 'utils/validation/validatePhoneNumber'
import { urlJoinWithQuery } from 'utils/url/urlJoinWithQuery'
import { createUser } from 'repositories/user/createUser'
import { getTimeZoneByName } from 'utils/date/getTimeZoneByName'

interface TwoFactorErrorInfo {
  method: TwoFactorAuthMethod
  token: TokenResponse
}

const API_URL = Env.getString('API_URL')
const APP_URL = Env.getString('APP_URL')

/**
 * If user has 2FA enabled, then trigger a promp once they are authenticated and pass a tmp token back to them
 * They will use that same token to re-authenticate once the MFA code comes in
 */
export const get2FAResults = async (user: User, req: Request) => {
  const appReq = req as AuthenticatedRequest
  const { twoFactorAuthMethod } = appReq.query

  // if user has 2FA enabled
  if (user.twoFactorAuthSettings?.methods?.length) {
    let methodToValidate = twoFactorAuthMethod
    if (!methodToValidate) {
      methodToValidate = user.twoFactorAuthSettings.preferred
    }
    if (!methodToValidate) {
      methodToValidate = user.twoFactorAuthSettings.methods[0]
    }
    /**
     * If user did not send the authentication code,
     * then send them a text message only if the method is SMS
     */
    if (methodToValidate === TwoFactorAuthMethod.SMS) {
      if (
        !user.mobilePhoneNumber ||
        !validatePhoneNumber(user.mobilePhoneNumber)
      ) {
        return new ApiError('invalidPhoneNumber', ApiErrorCode.BadRequest)
      }
      await sendSMSAuthCode(appReq.t, user, user.mobilePhoneNumber)
    }
    // otherwise, simply fail
    const twoFaError = new ApiError<TwoFactorErrorInfo>(
      'missing2FAToken',
      ApiErrorCode.Require2FA
    )
    twoFaError.data = {
      method: methodToValidate as TwoFactorAuthMethod,
      token: createTokenResponse(user),
    }
    return twoFaError
  }
  return null
}

/**
 * Boilerplate method used to attach a profile picture to a user if they sign in
 * with an OAuth provider and don't already have a picture
 */
const AWS_S3_STORAGE_BUCKET = Env.getString('AWS_S3_STORAGE_BUCKET')
export const createProfilePictureFromUrl = async (
  user: User,
  profile: Partial<Profile>
): Promise<FileTracker | null> => {
  try {
    if (!user.profilePicture) {
      let profileUrl: string = profile.photos?.[0]?.value || ''
      /**
       *  If we make it here, we know this object exists (even though it is optional)
       */
      const provider = user.oAuthSettings?.provider as OAuthProvider
      /**
       * M$ doesn't appear to send a profile picture back;
       * however, we can just call their API directly to get
       */
      if (!profileUrl && provider === OAuthProvider.Microsoft) {
        profileUrl = 'https://graph.microsoft.com/v1.0/me/photo/$value'
      }
      if (profileUrl) {
        const headers =
          provider === OAuthProvider.Microsoft
            ? {
                headers: {
                  Authorization: user.oAuthSettings?.accessToken || '',
                },
              }
            : {}
        const profileUrlResponse: globalThis.Response = await fetch(
          profileUrl,
          {
            ...headers,
          }
        )
        /**
         * Now that we have a ReadStream of data, we can upload to our S3 Bucket
         */
        const contentType =
          profileUrlResponse?.headers.get('content-type') || 'image/jpeg'
        if (profileUrlResponse.body) {
          const profilePicture = new FileTrackerModel({
            extension: `.${mime.extension(contentType)}`,
            mimeType:
              profileUrlResponse?.headers.get('content-type') || 'image/jpeg',
            bucket: AWS_S3_STORAGE_BUCKET,
            createdBy: user.id,
          })
          await profilePicture.uploadImage(
            AWS_S3_STORAGE_BUCKET,
            profileUrlResponse.body
          )
          await profilePicture.save()
          return profilePicture
        }
      }
    }
    return null
  } catch (e) {
    // logError but don't break the request
    // TODO: look into winston for logging...
    console.error(e)
    return null
  }
}

/**
 * Boilerplate code that either fetches a user or creates one if they don't exist
 * when logging in with an OAuth provider
 */
export const createOrFetchUserFromOAuthProfile = async (
  profile: Partial<Profile>,
  additionalProps: AnyObject
) => {
  const emailAddress: string = profile.emails?.[0]?.value || ''
  const user = await UserModel.findOne({ emailAddress })
  if (!user) {
    const newUser = await createUser({
      firstName: profile.name?.givenName || '?',
      lastName: profile.name?.familyName || '?',
      emailAddress,
      emailVerified: true,
      emailVerificationStartDate: DateTime.utc().toJSDate(),
      ...additionalProps,
    })

    const profilePicture = await createProfilePictureFromUrl(newUser, profile)
    if (profilePicture) {
      newUser.profilePicture = profilePicture
      await newUser.save()
    }
    return newUser
  } else {
    const profilePicture = await createProfilePictureFromUrl(user, profile)
    if (profilePicture) {
      user.profilePicture = profilePicture
    }
    if (additionalProps.oAuthSettings) {
      user.oAuthSettings = additionalProps.oAuthSettings
    }
    await user.save()
    return user
  }
}

interface LoginBody {
  twoFactorAuthMethod: TwoFactorAuthMethod
  token: string
  otp: string
}

/**
 * The client will call this method once they have authenticated the OAuth provider
 * but still need to validate their MFA token
 */
export const authenticate2FA_Code = async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const appReq = req as AppRequest
    const { body } = appReq
    const { twoFactorAuthMethod, otp, token } = body as LoginBody
    if (!otp || !twoFactorAuthMethod) {
      throw new ApiError('missing2FAToken', ApiErrorCode.Incorrect2FA)
    }
    const userJWT = verifyToken(token)
    if (!userJWT) {
      throw new ApiError('userNotFound', ApiErrorCode.NotFound)
    }
    const user = await UserModel.findOne({ _id: userJWT.id })
    if (!user) {
      throw new ApiError('userNotFound', ApiErrorCode.NotFound)
    }
    const isValidCode = await isValidAuthCode(
      user,
      twoFactorAuthMethod as TwoFactorAuthMethod,
      otp as string
    )
    if (!isValidCode) {
      throw new ApiError('incorrect2FAToken', ApiErrorCode.Incorrect2FA)
    }
    const newToken = createTokenResponse(user)
    res.send(newToken)
    next()
  } catch (e) {
    next(e)
  }
}

/**
 * The core mechanic method that gets called once a user authenticates
 * with an OAuth provider. If an email address is present, this method will
 * create or fetch the user and log them into the system.
 * If 2FA is required, it will thrown an error and prompt them to enter their code
 * @param role
 * @param path
 * @param provider
 * @returns
 */
export const generateOAuthBodyCallback = (
  role: UserRole,
  path: string,
  provider: OAuthProvider
) =>
  async function (
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    cb: (
      err?: string | Error | null,
      user?: Express.User,
      info?: unknown
    ) => unknown
  ) {
    try {
      /**
       * Require email to be passed in from the OAuth Profile...
       */
      const emailAddress: string = profile.emails?.[0]?.value || ''
      if (!emailAddress) {
        throw new ApiError('emailRequired', ApiErrorCode.BadRequest)
      }

      /**
       * For the short-term, we need to default the timezone to EST
       * for any user that logs in or registers with OAuth.
       * Future state: We can use an API service to geolocate the
       * user on the server side.
       */
      const tz = getTimeZoneByName('America/New_York')
      if (!tz) {
        throw new ApiError('invalidTimeZone', ApiErrorCode.BadRequest)
      }

      /**
       * Next, we want to fetch or create our user.
       * Whether they log in or sign up, they will be created in the database...
       */
      const user = await createOrFetchUserFromOAuthProfile(profile, {
        oAuthSettings: {
          accessToken,
          refreshToken,
          provider: provider,
        },
        roles: [role],
        settings: {
          timeZone: tz.name,
        },
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

/**
 * Once a user validates through the OAuth provider, this is the method that gets
 * called. It returns their session token
 * @returns
 */
export const generateOAuthTokenResponseCallback = () =>
  function (req: Request, res: Response) {
    const tokenResponse = createTokenResponse(req.user as User)
    res.send(tokenResponse)
  }

/**
 * Use this to be urls specific for redirecting back to the native app
 * @param query
 * @param path
 * @returns
 */
const buildOAuthRedirect = (
  query: OAuthResponse,
  path: OAuthType,
  device: OAuthDevice,
  role: UserRole,
  provider: OAuthProvider
) => {
  if (device === OAuthDevice.Desktop) {
    return `${APP_URL}/api/oauth/${provider}/${path}/${role}/callback/${urlJoinWithQuery(
      '',
      query
    )}`
  }
  const conversion: string = path === OAuthType.Login ? 'Login' : 'SignUp'
  return `ExpertSession:/${urlJoinWithQuery(`${conversion}`, query)}`
}

/**
 * This method will determine how to redirect the user back to the mobile application
 * @param passportId
 * @param path
 * @returns
 */
const handleOAuthCallbackResponse = (
  passportId: string,
  path: OAuthType,
  device: OAuthDevice,
  role: UserRole,
  provider: OAuthProvider
) =>
  function (req: Request, res: Response, next: NextFunction) {
    passport.authenticate(passportId, function (err: unknown, user: unknown) {
      try {
        if (err) {
          if (err instanceof ApiError) {
            if (err.data) {
              // cast
              const apiError = err.data as ApiError

              // for 2fa errors, a token and method will be attached
              const { method, token } = apiError
              const { code } = err

              // let's build our response body for the error
              let queryObject: OAuthResponse = {}
              if (method) queryObject.method = method
              if (token) queryObject = { ...queryObject, ...token }
              if (code) queryObject.error = code as ApiErrorCode

              // We must log the error since we are redirecting the user
              console.error(err)

              // Finally redirect
              return res.redirect(
                buildOAuthRedirect(queryObject, path, device, role, provider)
              )
            }
          } else {
            // We must log the error since we are redirecting the user
            console.error(err)
            return res.redirect(
              buildOAuthRedirect(
                {
                  error: ApiErrorCode.OAuthCodeUnknown,
                },
                path,
                device,
                role,
                provider
              )
            )
          }
        }
        // If we made it here, it is a success!
        const tokenResponse = createTokenResponse(user as User)
        return res.redirect(
          buildOAuthRedirect(
            {
              ...tokenResponse,
            },
            path,
            device,
            role,
            provider
          )
        )
      } catch (e) {
        console.error(e)
        return res.redirect(
          buildOAuthRedirect(
            {
              error: ApiErrorCode.OAuthCodeUnknown,
            },
            path,
            device,
            role,
            provider
          )
        )
      }
    })(req, res, next)
  }

/**
 * Configure the OAuth Provider strategy for use by Passport.
 * OAuth 2.0-based strategies require a `verify` function which receives the
 * credential (`accessToken`) for accessing the Facebook API on the user's
 * behalf, along with the user's profile.  The function must invoke `cb`
 * with a user object, which will be set at `req.user` in route handlers after.
 *
 * This method will generate those necessary routes...
 */

export const generatePassportRoutes = (
  path: OAuthType,
  role: UserRole,
  provider: OAuthProvider,
  router: Router,
  getStrategy: (
    role: UserRole,
    path: OAuthType,
    device: OAuthDevice
  ) => passport.Strategy
) => {
  // Apple sends the response back in a post vs get like the others
  const method: 'post' | 'get' =
    provider === OAuthProvider.Apple ? 'post' : 'get'
  const devices: OAuthDevice[] = Object.values(OAuthDevice)
  for (const device of devices) {
    const passportId = `${provider}-${path}-${role}-${device}`
    passport.use(passportId, getStrategy(role, path, device))
    router.get(`/${path}/${role}/${device}`, passport.authenticate(passportId))
    router[method](
      `/${path}/${role}/${device}/callback`,
      handleOAuthCallbackResponse(passportId, path, device, role, provider)
    )
  }
}

/**
 * Use this to generate a consistent callback URL for each OAuth provider
 * It is tricky to manage without something like this.
 * @param path
 * @param role
 * @param provider
 * @returns
 */
export const generateCallBackUrl = (
  path: OAuthType,
  role: UserRole,
  provider: OAuthProvider,
  device: OAuthDevice
) => `${API_URL}/oauth/${provider}/${path}/${role}/${device}/callback`

export const attachProviderRoutes = (
  provider: OAuthProvider,
  router: Router,
  getStrategy: (
    role: UserRole,
    path: OAuthType,
    device: OAuthDevice
  ) => passport.Strategy
) => {
  generatePassportRoutes(
    OAuthType.Login,
    UserRole.Consumer,
    provider,
    router,
    getStrategy
  )
  generatePassportRoutes(
    OAuthType.SignUp,
    UserRole.Consumer,
    provider,
    router,
    getStrategy
  )
  generatePassportRoutes(
    OAuthType.SignUp,
    UserRole.Expert,
    provider,
    router,
    getStrategy
  )
}

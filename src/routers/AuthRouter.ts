import express, { Request, Response, NextFunction } from 'express'
import { DateTime } from 'luxon'
import { JsonWebTokenError } from 'jsonwebtoken'
import { TFunction } from 'i18next'

import { createTokenResponse } from 'utils/auth/jwt'
import { ApiErrorCode, ApiError } from 'utils/error/ApiError'
import { UserModel, UserRole, TwoFactorAuthMethod, User } from 'models/User'
import {
  hashPassword,
  validatePassword,
  verifyPassword,
} from 'utils/auth/password'
import { verifyEmailVerificationToken } from 'utils/token/emailVerificationToken'
import { verifyResetPasswordToken } from 'utils/token/resetPasswordToken'
import { AppRequest, AuthenticatedRequest } from 'interfaces/Express'
import {
  getAuthenticatorInfo,
  isValidAuthCode,
  sendSMSAuthCode,
} from 'utils/2FA/authenticator'
import { requireAuthenticationMiddlewares } from 'middleware/authMiddleware'
import { validatePhoneNumber } from 'utils/validation/validatePhoneNumber'
import { PhoneNumber } from 'models/PhoneNumber'
import { Env } from 'utils/env'
import { getTimeZoneByName } from 'utils/date/getTimeZoneByName'
import { createUser } from 'repositories/user/createUser'
import { transferGuestUserResourcesAndDelete } from 'repositories/user/transferGuestUserResourcesAndDelete'
import { sendPasswordResetLink } from 'notifications/ResetPassword'
import { queueWelcomeNotification } from 'notifications/Welcome'
import { queueEmailVerificationNotification } from 'notifications/VerifyEmail'

const ES_CLIENT_KEY = Env.getString('ES_CLIENT_KEY')

export const AuthRouter = express.Router()
export const authRouterPathPrefix = '/auth'

interface TwoFactorErrorInfo {
  method: TwoFactorAuthMethod
}

const verify2FARequest = async (
  t: TFunction,
  user: User,
  twoFactorAuthMethod?: TwoFactorAuthMethod,
  otp?: string
) => {
  if (!user.twoFactorAuthSettings?.methods?.length) {
    return
  }
  let methodToValidate = twoFactorAuthMethod
  if (!methodToValidate) {
    methodToValidate = user.twoFactorAuthSettings.preferred
  }
  if (!methodToValidate) {
    methodToValidate = user.twoFactorAuthSettings.methods[0]
  }

  if (otp) {
    const isValidCode = await isValidAuthCode(
      user,
      methodToValidate as TwoFactorAuthMethod,
      otp
    )
    if (!isValidCode) {
      throw new ApiError('incorrect2FAToken', ApiErrorCode.Incorrect2FA)
    }
  } else {
    // if user did not send the authentication code
    // send them a text message only if the method is SMS
    if (methodToValidate === TwoFactorAuthMethod.SMS) {
      if (
        !user.mobilePhoneNumber ||
        !validatePhoneNumber(user.mobilePhoneNumber)
      ) {
        throw new ApiError('invalidPhoneNumber', ApiErrorCode.BadRequest)
      }
      await sendSMSAuthCode(t, user, user.mobilePhoneNumber)
    }
    // otherwise, simply fail
    throw new ApiError<TwoFactorErrorInfo>(
      'missing2FAToken',
      ApiErrorCode.Require2FA,
      {
        data: {
          method: methodToValidate,
        },
      }
    )
  }
}

interface LoginBody {
  emailAddress: string
  password: string
  twoFactorAuthMethod?: TwoFactorAuthMethod
  otp?: string
  guestUserId?: string
}

AuthRouter.post(
  '/login',
  async (req: Request, res: Response, next: NextFunction) => {
    const appReq = req as AppRequest
    const { t, body } = appReq
    const { emailAddress, password, twoFactorAuthMethod, otp, guestUserId } =
      body as LoginBody
    try {
      if (!emailAddress || !password) {
        throw new ApiError(
          'invalidCredentials',
          ApiErrorCode.IncorrectCredentials
        )
      }

      const user = await UserModel.findOne({ emailAddress, isGuest: false })

      if (!user) {
        throw new ApiError('userNotFound', ApiErrorCode.NotFound)
      }

      if (!user.password || !verifyPassword(user.password, password)) {
        throw new ApiError(
          'incorrectPassword',
          ApiErrorCode.IncorrectCredentials
        )
      }

      await verify2FARequest(t, user, twoFactorAuthMethod, otp)

      if (guestUserId) {
        const guestUser = await UserModel.findById(guestUserId)

        if (!guestUser) {
          throw new ApiError('guestUserNotFound', ApiErrorCode.NotFound)
        }
        if (!guestUser.isGuest) {
          throw new ApiError(
            'guestUserIdBelongsToNonGuestUser',
            ApiErrorCode.BadRequest
          )
        }
        await transferGuestUserResourcesAndDelete(guestUser, user)
      }

      const tokenResponse = createTokenResponse(user)
      res.status(200).json(tokenResponse)
      next()
    } catch (e) {
      next(e)
    }
  }
)

interface SignupRequest {
  firstName: string
  lastName: string
  emailAddress: string
  password: string
  roles: UserRole[]
  timeZone: string
  guestUserId?: string
}

AuthRouter.post(
  '/signup',
  async (req: Request, res: Response, next: NextFunction) => {
    const appReq = req as AppRequest
    const { body } = appReq
    const {
      firstName,
      lastName,
      emailAddress,
      password,
      roles,
      timeZone,
      guestUserId,
    } = body as SignupRequest
    try {
      if (!firstName || !lastName || !emailAddress || !password) {
        throw new ApiError('invalidRequest', ApiErrorCode.BadRequest)
      }

      if (!timeZone) {
        throw new ApiError(
          'timeZoneIsRequiredForSignup',
          ApiErrorCode.BadRequest
        )
      }

      const tz = getTimeZoneByName(timeZone)

      if (!tz) {
        throw new ApiError('invalidTimeZone', ApiErrorCode.BadRequest)
      }

      const existingUser = await UserModel.findOne({
        emailAddress,
        isGuest: false,
      })
      if (existingUser) {
        res
          .status(400)
          .json(
            new ApiError('userAlreadyRegistered', ApiErrorCode.AlreadyExists)
          )
        return
      }

      const { valid, results } = validatePassword(password)
      if (!valid) {
        res.status(400).json(
          new ApiError('invalidPassword', ApiErrorCode.InvalidPassword, {
            validationErrors: results,
          })
        )
        return
      }

      const newUser = await createUser({
        firstName,
        lastName,
        emailAddress,
        emailVerificationStartDate: DateTime.utc().toJSDate(),
        password,
        roles,
        settings: {
          timeZone: tz.name,
        },
      })

      if (guestUserId) {
        const guestUser = await UserModel.findById(guestUserId)

        if (!guestUser) {
          throw new ApiError('guestUserNotFound', ApiErrorCode.NotFound)
        }
        if (!guestUser.isGuest) {
          throw new ApiError(
            'guestUserIdBelongsToNonGuestUser',
            ApiErrorCode.BadRequest
          )
        }
        await transferGuestUserResourcesAndDelete(guestUser, newUser)
      }

      const tokenResponse = createTokenResponse(newUser)
      res.status(201).json(tokenResponse)
      queueEmailVerificationNotification({ user: newUser })
      queueWelcomeNotification({ user: newUser })
    } catch (e) {
      next(e)
    }
  }
)

interface VerifyEmailBody {
  emailVerificationToken: string
}

AuthRouter.patch(
  '/verify-email',
  async (req: Request, res: Response, next: NextFunction) => {
    const appReq = req as AppRequest
    const { body } = appReq
    const { emailVerificationToken } = body as VerifyEmailBody

    try {
      const emailAddress = verifyEmailVerificationToken(emailVerificationToken)

      const user = await UserModel.findOne({ emailAddress, isGuest: false })
      if (!user) {
        throw new ApiError('userNotFound', ApiErrorCode.NotFound)
      }

      const { emailVerified } = user

      if (emailVerified) {
        res
          .status(400)
          .json(
            new ApiError(
              'emailAlreadyVerified',
              ApiErrorCode.PreviouslyCompleted
            )
          )
        return
      }

      await UserModel.updateOne(
        { _id: user._id },
        { emailVerified: true },
        { runValidators: true }
      )
      res.sendStatus(204)
    } catch (e) {
      const jwtError = e as JsonWebTokenError
      if (jwtError.name === 'TokenExpiredError') {
        res
          .status(410)
          .json(new ApiError('emailVerificationExpired', ApiErrorCode.Expired))
        return
      }
      next(e)
    }
  }
)

interface SendResetPasswordLinkBody {
  emailAddress: string
}

AuthRouter.post(
  '/send-password-reset-link',
  async (req: Request, res: Response, next: NextFunction) => {
    const appReq = req as AppRequest
    const { body } = appReq
    const { emailAddress } = body as SendResetPasswordLinkBody

    try {
      const user = await UserModel.findOne({ emailAddress, isGuest: false })
      if (!user) {
        throw new ApiError('userNotFound', ApiErrorCode.NotFound)
      }

      sendPasswordResetLink({ user })
      res.sendStatus(204)
    } catch (e) {
      next(e)
    }
  }
)

interface ResetPasswordBody {
  password: string
  token: string
}

AuthRouter.put(
  '/reset-password',
  async (req: Request, res: Response, next: NextFunction) => {
    const appReq = req as AppRequest
    const { body } = appReq
    const { password, token } = body as ResetPasswordBody

    try {
      const { valid, results } = validatePassword(password)
      if (!valid) {
        res.status(400).json(
          new ApiError('invalidPassword', ApiErrorCode.InvalidPassword, {
            validationErrors: results,
          })
        )
        return
      }

      const emailAddress = verifyResetPasswordToken(token)
      const user = await UserModel.findOne({ emailAddress, isGuest: false })
      if (!user) {
        throw new ApiError('userNotFound', ApiErrorCode.NotFound)
      }
      await UserModel.updateOne(
        { _id: user._id },
        { password: hashPassword(password) },
        { runValidators: true }
      )
      const tokenResponse = createTokenResponse(user)
      res.status(200).json(tokenResponse)
    } catch (e) {
      const jwtError = e as JsonWebTokenError
      if (jwtError.name === 'TokenExpiredError') {
        res
          .status(410)
          .json(new ApiError('resetPasswordExpired', ApiErrorCode.Expired))
        return
      }
      next(e)
    }
  }
)

interface ChangePasswordBody {
  oldPassword: string
  newPassword: string
  otp: string
  twoFactorAuthMethod?: TwoFactorAuthMethod
}

AuthRouter.put('/change-password', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction) => {
    const appReq = req as AuthenticatedRequest
    const { user, t, body } = appReq
    const { oldPassword, newPassword, otp, twoFactorAuthMethod } =
      body as ChangePasswordBody

    try {
      if (!user.password || !verifyPassword(user.password, oldPassword)) {
        throw new ApiError('incorrectPassword', ApiErrorCode.Forbidden)
      }

      const { valid, results } = validatePassword(user.password)
      if (!valid) {
        res.status(400).json(
          new ApiError('invalidPassword', ApiErrorCode.InvalidPassword, {
            validationErrors: results,
          })
        )
        return
      }

      // if user has 2FA enabled
      await verify2FARequest(t, user, twoFactorAuthMethod, otp)

      await UserModel.updateOne(
        { _id: user._id },
        { password: hashPassword(newPassword) },
        { runValidators: true }
      )

      res.sendStatus(204)
    } catch (e) {
      const jwtError = e as JsonWebTokenError
      if (jwtError.name === 'TokenExpiredError') {
        res
          .status(410)
          .json(new ApiError('resetPasswordExpired', ApiErrorCode.Expired))
        return
      }
      next(e)
    }
  },
])

interface SendSmsAuthCodeBody {
  phoneNumber?: PhoneNumber
}

AuthRouter.post('/send-sms-auth-code', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, t } = appReq
    const body = appReq.body as unknown as SendSmsAuthCodeBody
    try {
      const mobilePhoneNumber = body?.phoneNumber || user.mobilePhoneNumber

      if (!mobilePhoneNumber || !validatePhoneNumber(mobilePhoneNumber)) {
        throw new ApiError('invalidPhoneNumber', ApiErrorCode.BadRequest)
      }

      await sendSMSAuthCode(t, user, mobilePhoneNumber)

      res.sendStatus(204)
    } catch (e) {
      next(e)
    }
  },
])

AuthRouter.get('/authenticator-info', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user } = appReq
    try {
      const authenticatorInfo = await getAuthenticatorInfo(user)

      res.status(200).json(authenticatorInfo)
    } catch (e) {
      next(e)
    }
  },
])

interface GuestUserRequest {
  timeZone?: string
}

AuthRouter.post('/guest-user', [
  ...requireAuthenticationMiddlewares({
    allowBearerToken: false,
    apiKey: ES_CLIENT_KEY,
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    const appReq = req as AppRequest
    const { body } = appReq
    const { timeZone = 'UTC' } = body as GuestUserRequest
    try {
      const tz = getTimeZoneByName(timeZone)

      if (!tz) {
        throw new ApiError('invalidTimeZone', ApiErrorCode.BadRequest)
      }

      const newUser = await createUser({
        firstName: 'Guest',
        lastName: 'User',
        emailVerificationStartDate: DateTime.utc().toJSDate(),
        settings: {
          timeZone: tz.name,
        },
        isGuest: true,
      })

      const tokenResponse = createTokenResponse(newUser)
      res.status(201).json(tokenResponse)
    } catch (e) {
      next(e)
    }
  },
])

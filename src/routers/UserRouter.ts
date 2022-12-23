import express, { Request, Response, NextFunction } from 'express'
import isEmpty from 'lodash/isEmpty'
import isJSON from 'validator/lib/isJSON'

import { ApiError, ApiErrorCode, ValidationError } from 'utils/error/ApiError'
import { User, UserModel, UserRole } from 'models/User'
import { requireAuthenticationMiddlewares } from 'middleware/authMiddleware'
import { Env } from 'utils/env'
import { AuthenticatedRequest } from 'interfaces/Express'
import {
  ExpectedFormField,
  ExpectedFormFile,
  ParsedHttpForm,
} from 'utils/http/form/ParsedHttpForm'
import { FileTracker, FileTrackerModel } from 'models/FileTracker'
import { isValidAuthCode } from 'utils/2FA/authenticator'
import { getExpertProfileByUser } from 'repositories/user/getExpertProfileByUser'
import { getUserSessionsByStatus } from 'repositories/user/getUserSessionsByStatus'
import { userPopulationPaths } from 'repositories/user/populateUser'
import { populateExpertFavorite } from 'repositories/expert/populateExpert'
import { updateExpertIndex } from 'search/expertIndex'

const AWS_S3_STORAGE_BUCKET = Env.getString('AWS_S3_STORAGE_BUCKET')

export const userRouterPathPrefix = '/users'
export const UserRouter = express.Router()

UserRouter.get('/me', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    try {
      res.status(200).json(appReq.user)
    } catch (e) {
      next(e)
    }
  },
])

UserRouter.get('/details', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    try {
      if (appReq.user.roles.indexOf(UserRole.Expert) !== -1) {
        const expert = await getExpertProfileByUser(appReq.user)
        if (expert) {
          res.status(200).json({ user: appReq.user, expert })
          return
        }
      }
      res.status(200).json({ user: appReq.user, expert: null })
    } catch (e) {
      next(e)
    }
  },
])

interface GetUserParams {
  userId: string
}

UserRouter.get('/:userId/expert', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { params } = appReq
    const { userId } = params as unknown as GetUserParams
    try {
      const user = await UserModel.findById(userId)
      if (!user) {
        throw new ApiError('userNotFound', ApiErrorCode.NotFound)
      }

      const expert = await getExpertProfileByUser(user)
      if (!expert) {
        throw new ApiError('expertNotFound', ApiErrorCode.NotFound)
      }
      expert.user = user
      const populatedExpert = await populateExpertFavorite(expert, user)
      res.status(200).json(populatedExpert)
    } catch (e) {
      next(e)
    }
  },
])

UserRouter.patch('/:userId', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // TODO: this request needs to be broken down into multiple functions at some point
    const appReq = req as AuthenticatedRequest
    const { user, params } = appReq
    const { userId } = params as unknown as GetUserParams
    try {
      const existingUser = await UserModel.findById(userId)
      if (!existingUser) {
        throw new ApiError('userNotFound', ApiErrorCode.NotFound)
      }

      const existingProfilePicture = existingUser.profilePicture as
        | FileTracker
        | undefined

      const profilePicture = new ExpectedFormFile<FileTracker>({
        formName: 'profilePicture',
        expectedMimeType: 'image/*',
        onUpload: (stream, formFile) => {
          const file = FileTrackerModel.fromFormFile(formFile, {
            createdBy: user.id,
          })
          file.createdBy = user.id
          return file.uploadProfilePicture(AWS_S3_STORAGE_BUCKET, stream)
        },
      })

      const userData = new ExpectedFormField({
        formName: 'userData',
        validate: (value) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          if (!isJSON(value as string, { allow_primitives: false })) {
            throw new ValidationError('updateJsonIsNotValid', {
              path: 'userData',
              type: 'pattern',
              value,
            })
          }
        },
      })

      const otp = new ExpectedFormField({
        formName: 'otp',
      })

      const { validationErrors } = await ParsedHttpForm.fromRequest(req, {
        expectedFiles: [profilePicture],
        expectedFields: [userData, otp],
      })

      if (validationErrors.length) {
        throw new ApiError('updateFormIsNotValid', ApiErrorCode.BadRequest, {
          validationErrors: validationErrors,
        })
      }

      let userUpdateData: Partial<User> = {}
      if (userData.value) {
        userUpdateData = JSON.parse(userData.value as string) as Partial<User>

        if (userUpdateData.emailAddress) {
          const userWithEmail = await UserModel.findOne({
            emailAddress: userUpdateData.emailAddress,
          })
          if (userWithEmail && existingUser.id !== userWithEmail.id) {
            res
              .status(409)
              .json(
                new ApiError('emailAlreadyUsed', ApiErrorCode.AlreadyExists)
              )
            return
          }
        }
      }

      if (userUpdateData.twoFactorAuthSettings) {
        const existing2FASettings = existingUser.twoFactorAuthSettings
        const updated2FASettings = userUpdateData.twoFactorAuthSettings

        const removedMethods = existing2FASettings?.methods?.filter(
          (method) =>
            !updated2FASettings?.methods?.find(
              (existingMethod) => existingMethod === method
            )
        )

        const newMethods = updated2FASettings?.methods?.filter(
          (method) =>
            !existing2FASettings?.methods?.find(
              (existingMethod) => existingMethod === method
            )
        )

        if (removedMethods?.length && newMethods?.length) {
          throw new ApiError(
            'cannotAddAndRemoveMultiple2FAMethodsAtOnce',
            ApiErrorCode.BadRequest
          )
        }

        if (removedMethods?.length) {
          if (removedMethods.length > 1) {
            throw new ApiError(
              'cannotRemoveMultiple2FAMethodsAtOnce',
              ApiErrorCode.BadRequest
            )
          }

          if (!otp.value) {
            throw new ApiError('missing2FAToken', ApiErrorCode.Require2FA)
          }

          const [removed2FAMethod] = removedMethods
          const isValidCode = await isValidAuthCode(
            existingUser,
            removed2FAMethod,
            otp.value as string
          )
          if (!isValidCode) {
            throw new ApiError('incorrect2FAToken', ApiErrorCode.Incorrect2FA)
          }
        }

        if (newMethods?.length) {
          if (newMethods.length > 1) {
            throw new ApiError(
              'cannotAddMultiple2FAMethodsAtOnce',
              ApiErrorCode.BadRequest
            )
          }

          if (!otp.value) {
            throw new ApiError('missing2FAToken', ApiErrorCode.Require2FA)
          }

          const [new2FAMethod] = newMethods
          const isValidCode = await isValidAuthCode(
            existingUser,
            new2FAMethod,
            otp.value as string
          )
          if (!isValidCode) {
            throw new ApiError('incorrect2FAToken', ApiErrorCode.Incorrect2FA)
          }
        }

        userUpdateData.twoFactorAuthSettings = Object.assign(
          {},
          existing2FASettings?.toJSON() || {},
          updated2FASettings
        )

        userUpdateData.twoFactorAuthSettings.authenticationSecret =
          existing2FASettings?.authenticationSecret

        const { preferred, methods } = userUpdateData.twoFactorAuthSettings

        if (preferred && methods && !methods.includes(preferred)) {
          throw new ApiError('2FAMethodNotInMethods', ApiErrorCode.BadRequest)
        }
      }

      const newProfilePicture = await profilePicture?.getUploadPromise()
      if (newProfilePicture) {
        userUpdateData.profilePicture = newProfilePicture
      }

      if (isEmpty(userUpdateData)) {
        res
          .status(400)
          .json(new ApiError('noUpdateUserData', ApiErrorCode.BadRequest))
        return
      }

      if (userUpdateData.settings) {
        userUpdateData.settings = Object.assign(
          {},
          existingUser.settings.toJSON() || {},
          userUpdateData.settings
        )
      }

      delete userUpdateData.password
      const updatedUser = await UserModel.findByIdAndUpdate(
        existingUser._id,
        userUpdateData,
        {
          new: true,
          runValidators: true,
        }
      ).populate(userPopulationPaths)

      if (
        existingProfilePicture &&
        (userUpdateData.profilePicture === null || newProfilePicture)
      ) {
        await existingProfilePicture.deactivate()
      }

      res.status(200).json(updatedUser)
    } catch (e) {
      next(e)
    }
  },
])

UserRouter.get('/:userId/session-counts', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { params } = appReq
    const { userId } = params as unknown as GetUserParams
    try {
      const user = await UserModel.findById(userId)
      if (!user) {
        throw new ApiError('userNotFound', ApiErrorCode.NotFound)
      }
      const sessionsByStatus = await getUserSessionsByStatus(user)
      res.status(200).json(sessionsByStatus)
    } catch (e) {
      next(e)
    }
  },
])

type StatusUpdateBody = Pick<User, 'status'>

UserRouter.patch('/:userId/status', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { params, body } = appReq
    const { userId } = params as unknown as GetUserParams
    const { status: newStatus } = body as StatusUpdateBody

    try {
      const user = await UserModel.findById(userId)
      if (!user) {
        throw new ApiError('userNotFound', ApiErrorCode.NotFound)
      }

      const updatedUser = await UserModel.findByIdAndUpdate(
        user._id,
        {
          status: newStatus,
        },
        {
          new: true,
          runValidators: true,
        }
      ).populate(userPopulationPaths)

      res.status(200).json(updatedUser)

      const expert = await getExpertProfileByUser(user)
      if (expert) {
        updateExpertIndex(expert.id)
      }
    } catch (e) {
      next(e)
    }
  },
])

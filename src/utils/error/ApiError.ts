import mongoose from 'mongoose'
import { ErrorObject } from 'ajv'

import { TwoFactorAuthMethod } from 'models/User'
import { TokenResponse } from 'utils/auth/jwt'

const convertMongooseValidationKindToValidationErrorType = (
  kind: string
): ValidationErrorType => {
  switch (kind) {
    case 'user defined':
      return 'pattern'
    default:
      return 'pattern'
  }
}

const convertMongooseErrorToValidationErrors = (
  error:
    | mongoose.Error.ValidationError
    | mongoose.Error.ValidatorError
    | mongoose.Error.CastError
): ValidationError[] => {
  const errors: ValidationError[] = []
  if (error instanceof mongoose.Error.ValidationError) {
    const nestedErrors = convertMongooseErrorObjectToValidationErrors(
      error.errors
    )
    errors.push(...nestedErrors)
  } else if (error instanceof mongoose.Error.ValidatorError) {
    errors.push(
      new ValidationError(error.message, {
        type: convertMongooseValidationKindToValidationErrorType(error.kind),
        path: error.path,
        value: error.value,
      })
    )
  }
  return errors
}

const convertMongooseErrorObjectToValidationErrors = (errors: {
  [path: string]:
    | mongoose.Error.ValidationError
    | mongoose.Error.ValidatorError
    | mongoose.Error.CastError
}): ValidationError[] => {
  const validationErrors: ValidationError[] = []
  Object.values(errors).forEach((err) => {
    const mongooseError = err as
      | mongoose.Error.ValidationError
      | mongoose.Error.ValidatorError
      | mongoose.Error.CastError

    const nestedErrors = convertMongooseErrorToValidationErrors(mongooseError)
    validationErrors.push(...nestedErrors)
  })
  return validationErrors
}

export type ValidationErrorType = 'pattern' | 'required'

export interface ValidationErrorInfo {
  type: ValidationErrorType | string
  path: string
  value?: unknown
}

export class ValidationError extends Error {
  message!: string
  type: ValidationErrorType | string
  path: string
  value: unknown
  constructor(message: string, details: ValidationErrorInfo) {
    super(message)
    this.type = details.type
    this.path = details.path
    this.value = details.value
  }

  toJSON(): Record<string, unknown> {
    const error: Record<string, unknown> = {
      message: this.message,
      type: this.type,
      path: this.path,
      value: this.value,
      stack: this.stack,
    }

    return error
  }
}

export enum ApiErrorCode {
  Unknown = 'UNKNOWN',
  NotAuthorized = 'NOT_AUTHORIZED',
  NotFound = 'NOT_FOUND',
  IncorrectCredentials = 'INCORRECT_CREDENTIALS',
  ValidationFailed = 'VALIDATION_FAILED',
  Require2FA = 'REQUIRE_2FA',
  Incorrect2FA = 'INCORRECT_2FA',
  Expired = 'EXPIRED',
  PreviouslyCompleted = 'PREVIOUSLY_COMPLETED',
  AlreadyExists = 'ALREADY_EXISTS',
  BadRequest = 'BAD_REQUEST',
  Forbidden = 'FORBIDDEN',
  InvalidPassword = 'INVALID_PASSWORD',
  OAuthCodeUnknown = 'OAUTH_UNKNOWN',
}

export class ApiError<T = unknown> extends Error {
  apiError = true
  message!: string
  code: ApiErrorCode
  validationErrors?: ValidationError[]
  token?: TokenResponse
  method?: TwoFactorAuthMethod
  data?: T
  constructor(
    message: string,
    code: ApiErrorCode = ApiErrorCode.Unknown,
    options?: Partial<Omit<ApiError<T>, 'message' | 'code'>>
  ) {
    super(message)
    this.code = code

    if (options) {
      Object.assign(this, options)
    }
  }

  static fromError(error: Error): ApiError {
    if ((error as ApiError).apiError) {
      return error as ApiError
    }
    const apiError = new ApiError(error.message)
    if (error instanceof ValidationError) {
      apiError.validationErrors = [error]
    } else if (error instanceof mongoose.Error.ValidationError) {
      const mongooseError = error as mongoose.Error.ValidationError
      apiError.code = ApiErrorCode.ValidationFailed
      apiError.validationErrors =
        convertMongooseErrorToValidationErrors(mongooseError)
    }
    return apiError
  }

  static fromSchemaValidationErrors(
    errors: ErrorObject[],
    message = 'Schema validation failed'
  ): ApiError {
    const apiError = new ApiError(message)
    const validationErrors: ValidationError[] = []
    errors.forEach((error) => {
      validationErrors.push(
        new ValidationError(error.message || '', {
          type: error.keyword,
          path: error.instancePath,
          value: error.data,
        })
      )
    })
    apiError.validationErrors = validationErrors
    return apiError
  }

  toJSON(): Record<string, unknown> {
    const error: Record<string, unknown> = {
      message: this.message,
      code: this.code,
      validationErrors: this.validationErrors,
      data: this.data,
    }

    return error
  }
}

export const convertErrorCodeToHttpCode = (errorCode: ApiErrorCode): number => {
  switch (errorCode) {
    case ApiErrorCode.NotAuthorized:
    case ApiErrorCode.IncorrectCredentials:
      return 401
    case ApiErrorCode.Expired:
      return 410
    case ApiErrorCode.NotFound:
      return 404
    case ApiErrorCode.BadRequest:
    case ApiErrorCode.ValidationFailed:
    case ApiErrorCode.Require2FA:
      return 400
    case ApiErrorCode.PreviouslyCompleted:
    case ApiErrorCode.AlreadyExists:
      return 409
    case ApiErrorCode.Forbidden:
    case ApiErrorCode.Incorrect2FA:
      return 403
  }
  return 500
}

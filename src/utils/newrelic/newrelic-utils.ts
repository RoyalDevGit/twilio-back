import { Env } from 'utils/env'
import { ApiError, ApiErrorCode } from 'utils/error/ApiError'

const NEW_RELIC_LICENSE_KEY = Env.getString('NEW_RELIC_LICENSE_KEY')
const NEW_RELIC_APP_NAME = Env.getString('NEW_RELIC_APP_NAME')
const NEW_RELIC_CAPTURE_SEGMENTS = Env.getBoolean('NEW_RELIC_APP_NAME') || false

const ignoredCodes: ApiErrorCode[] = [
  ApiErrorCode.Forbidden,
  ApiErrorCode.InvalidPassword,
  ApiErrorCode.NotAuthorized,
  ApiErrorCode.Require2FA,
  ApiErrorCode.NotFound,
  ApiErrorCode.Incorrect2FA,
  ApiErrorCode.IncorrectCredentials,
]

let newRelicInstance:
  | undefined
  | {
      startSegment: <T, C extends (...args: unknown[]) => unknown>(
        name: string,
        record: boolean,
        handler: (cb?: C) => T
      ) => T
      setTransactionName: (name: string) => void
      noticeError: (
        error: Error,
        customAttributes?: { [key: string]: string | number | boolean }
      ) => void
    }

export const initializeNewRelicInstance = () => {
  if (NEW_RELIC_APP_NAME && NEW_RELIC_LICENSE_KEY) {
    newRelicInstance = require('newrelic')
    return newRelicInstance
  }
  return null
}

export const noticeError = (e: unknown) => {
  if (newRelicInstance) {
    if (e instanceof ApiError) {
      const apiError = e as ApiError
      if (apiError.code && ignoredCodes.indexOf(apiError.code) !== -1) {
        return
      }
    }
    newRelicInstance.noticeError(e as Error)
  }
}

export const setTransactionName = (name: string) => {
  if (newRelicInstance) {
    newRelicInstance.setTransactionName(name)
  }
}

export const startSegment = async <
  T,
  C extends (...args: unknown[]) => unknown
>(
  name: string,
  record: boolean,
  handler: (cb?: C) => T
): Promise<T> => {
  if (newRelicInstance && NEW_RELIC_CAPTURE_SEGMENTS) {
    return newRelicInstance.startSegment(name, record, handler)
  }
  return handler()
}

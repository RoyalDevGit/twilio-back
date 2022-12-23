import { Request, Response, NextFunction } from 'express'
import i18next, { use, getFixedT, i18n, InitOptions } from 'i18next'
import FilesystemBackend from 'i18next-fs-backend'

import { AppSocketIORequest } from 'interfaces/AppSocketIORequest'
import { AppRequest } from 'interfaces/Express'
import { SocketIOMiddleware } from 'interfaces/SocketIOMiddleware'

const backendOptions = {
  loadPath: 'locales/{{lng}}/{{ns}}.json',
}

const fallbackLng = 'en'

const options: InitOptions = {
  fallbackLng,
  preload: ['en'],
  ns: ['translation', 'notifications'],
  defaultNS: 'translation',
  initImmediate: false,
  backend: backendOptions,
}

use(FilesystemBackend).init(options)

export const i18nMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const appReq = req as AppRequest
  const { query } = req
  const { locale } = query
  const reqLng = (appReq.get('Accept-Language') || locale) as string

  let i18nextInstance: i18n
  if (reqLng && reqLng !== fallbackLng) {
    i18nextInstance = i18next.cloneInstance()
    appReq.t = await i18nextInstance.changeLanguage(reqLng)
  } else {
    appReq.t = getFixedT(fallbackLng)
  }
  next()
}

export const socketI18nMiddleware: SocketIOMiddleware = async (
  socket,
  next
) => {
  const appReq = socket.request as AppSocketIORequest
  const reqLng = appReq.headers['accept-language'] as string

  let i18nextInstance: i18n
  if (reqLng && reqLng !== fallbackLng) {
    i18nextInstance = i18next.cloneInstance()
    appReq.t = await i18nextInstance.changeLanguage(reqLng)
  } else {
    appReq.t = getFixedT(fallbackLng)
  }
  next()
}

export const getNotificationTFunction = async (
  _languageCode: string | undefined
) => {
  const i18nextInstance = i18next.cloneInstance()
  return i18nextInstance.getFixedT(fallbackLng, 'notifications')
}

export { i18next }

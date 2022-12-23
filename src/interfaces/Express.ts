import { Request } from 'express'
import { TFunction } from 'i18next'

import { User as AppUser } from 'models/User'

export interface AppRequest extends Request {
  jwt: {
    id: string
  }
  t: TFunction
  user?: AppUser
}

export interface AuthenticatedRequest extends AppRequest {
  user: AppUser
}

export class HttpException extends Error {
  status: number
  message: string
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.message = message
  }
}

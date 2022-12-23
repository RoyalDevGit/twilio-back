import { IncomingMessage } from 'http'

import { TFunction } from 'i18next'

import { User } from 'models/User'

export interface AppSocketIORequest extends IncomingMessage {
  t: TFunction
  user?: User
}

export interface AuthenticatedSocketIORequest extends AppSocketIORequest {
  user: User
}

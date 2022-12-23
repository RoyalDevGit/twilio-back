import { Request, Response } from 'express'

import { ActionTokenData } from 'interfaces/ActionTokenData'
import { ApiError } from 'utils/error/ApiError'

export interface ActionHandlerResponseBody {
  data?: unknown
  redirectTo?: string
}

export interface ActionHandlerRequest extends Request {
  body: ActionHandlerResponseBody | ApiError
}

export interface ActionHandler<T> {
  (
    actionTokenData: ActionTokenData<T>,
    req: ActionHandlerRequest,
    res: Response
  ): Promise<void>
}

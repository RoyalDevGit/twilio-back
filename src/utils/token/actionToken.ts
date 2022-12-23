import jwt from 'jsonwebtoken'

import { Env } from 'utils/env'
import { ActionTokenData } from 'interfaces/ActionTokenData'

const ACTION_JWT_SECRET = Env.getString('ACTION_JWT_SECRET')

export const createActionToken = <T>(
  actionTokenData: ActionTokenData<T>,
  expiresIn: string | number
): string => jwt.sign(actionTokenData, ACTION_JWT_SECRET, { expiresIn })

export const verifyActionToken = <T>(token: string): ActionTokenData<T> =>
  jwt.verify(token, ACTION_JWT_SECRET) as ActionTokenData<T>

import jwt from 'jsonwebtoken'
import ms from 'ms'

import { User } from 'models/User'
import { Env } from 'utils/env'

const JWT_SECRET = Env.getString('JWT_SECRET')
const JWT_EXPIRES_IN = Env.getString('JWT_EXPIRES_IN')

export interface TokenResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
}

export const createTokenResponse = (user: User): TokenResponse => {
  const accessToken = jwt.sign({ id: user.id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })

  return {
    accessToken,
    tokenType: 'bearer',
    expiresIn: ms(JWT_EXPIRES_IN) / 1000,
  }
}

export const createToken = (string: string) => {
  const accessToken = jwt.sign({ string }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
  return accessToken
}

export const verifyToken = (token: string): User =>
  jwt.verify(token, JWT_SECRET) as User

import jwt from 'jsonwebtoken'

import { Env } from 'utils/env'

const RESET_PASSWORD_JWT_SECRET = Env.getString('RESET_PASSWORD_JWT_SECRET')
const RESET_PASSWORD_JWT_EXPIRES_IN = Env.getString(
  'RESET_PASSWORD_JWT_EXPIRES_IN'
)

interface ResetPasswordData {
  emailAddress: string
}

export const createResetPasswordToken = (emailAddress: string): string =>
  jwt.sign({ emailAddress }, RESET_PASSWORD_JWT_SECRET, {
    expiresIn: RESET_PASSWORD_JWT_EXPIRES_IN,
  })

export const verifyResetPasswordToken = (token: string): string => {
  const { emailAddress } = jwt.verify(
    token,
    RESET_PASSWORD_JWT_SECRET
  ) as ResetPasswordData
  return emailAddress
}

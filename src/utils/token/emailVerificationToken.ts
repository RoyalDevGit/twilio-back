import jwt from 'jsonwebtoken'

import { Env } from 'utils/env'

const EMAIL_VERIFICATION_JWT_SECRET = Env.getString(
  'EMAIL_VERIFICATION_JWT_SECRET'
)
const EMAIL_VERIFICATION_JWT_EXPIRES_IN = Env.getString(
  'EMAIL_VERIFICATION_JWT_EXPIRES_IN'
)

interface EmailVerificationData {
  emailAddress: string
}

export const createEmailVerificationToken = (emailAddress: string): string =>
  jwt.sign({ emailAddress }, EMAIL_VERIFICATION_JWT_SECRET, {
    expiresIn: EMAIL_VERIFICATION_JWT_EXPIRES_IN,
  })

export const verifyEmailVerificationToken = (token: string): string => {
  const { emailAddress } = jwt.verify(
    token,
    EMAIL_VERIFICATION_JWT_SECRET
  ) as EmailVerificationData
  return emailAddress
}

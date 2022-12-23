import { TOTP } from '@otplib/core'
import { authenticator } from 'otplib'
import { createDigest } from '@otplib/plugin-crypto'
import { TFunction } from 'i18next'
import qrcode from 'qrcode'

import {
  User,
  TwoFactorAuthMethod,
  TwoFactorAuthSettingsModel,
} from 'models/User'
import { Env } from 'utils/env'
import { sendSMS } from 'apis/AwsSNS'
import { decrypt, encrypt } from 'utils/crypto/aes'
import { PhoneNumber } from 'models/PhoneNumber'
import { joinPhoneNumber } from 'utils/string/joinPhoneNumber'

const TWOFA_AUTHENTICATOR_APP_NAME = Env.getString('2FA_AUTHENTICATOR_APP_NAME')
const TWOFA_SECRET_ENCRYPTION_KEY = Env.getString('2FA_SECRET_ENCRYPTION_KEY')
const TWOFA_SMS_TOTP_STEP = Env.getDuration('2FA_SMS_TOTP_STEP')
const TWOFA_SMS_TOTP_WINDOW = Env.getDuration('2FA_SMS_TOTP_WINDOW')

const smsTotp = new TOTP({
  createDigest,
  step: TWOFA_SMS_TOTP_STEP.as('seconds'),
  window: TWOFA_SMS_TOTP_WINDOW.as('seconds'),
})

const decryptSecretKey = (encryptedKey: string) =>
  decrypt(encryptedKey, TWOFA_SECRET_ENCRYPTION_KEY)

export const generateUserAuthenticationSecret = async (user: User) => {
  if (user.twoFactorAuthSettings?.authenticationSecret) {
    return
  }
  const secret = authenticator.generateSecret()
  const encryptedSecretKey = encrypt(secret, TWOFA_SECRET_ENCRYPTION_KEY)
  if (user.twoFactorAuthSettings) {
    user.twoFactorAuthSettings.authenticationSecret = encryptedSecretKey
  } else {
    user.twoFactorAuthSettings = new TwoFactorAuthSettingsModel({
      authenticationSecret: encryptedSecretKey,
    })
  }
  await user.save()
}

interface AuthenticatorInfo {
  secretKey: string
  qrCodeUrl: string
  keyUri: string
}

export const getAuthenticatorInfo = async (
  user: User
): Promise<AuthenticatorInfo> => {
  await generateUserAuthenticationSecret(user)
  if (!user.twoFactorAuthSettings?.authenticationSecret) {
    throw new Error('User does not have an authentication secret key')
  }
  const decryptedKey = decryptSecretKey(
    user.twoFactorAuthSettings.authenticationSecret
  )
  const otpauth = authenticator.keyuri(
    user.emailAddress,
    TWOFA_AUTHENTICATOR_APP_NAME,
    decryptedKey
  )

  const qrCodeUrl = await new Promise<string>((resolve, reject) => {
    qrcode.toDataURL(otpauth, (err: Error, imageUrl: string) => {
      if (err) {
        reject(err)
        return
      }
      resolve(imageUrl)
    })
  })

  return {
    secretKey: decryptedKey,
    keyUri: otpauth,
    qrCodeUrl,
  }
}

export const createSmsCode = async (user: User) => {
  await generateUserAuthenticationSecret(user)
  if (!user.twoFactorAuthSettings?.authenticationSecret) {
    throw new Error('User does not have an authentication secret key')
  }
  const decryptedKey = decryptSecretKey(
    user.twoFactorAuthSettings.authenticationSecret
  )
  return smsTotp.generate(decryptedKey)
}

export const sendSMSAuthCode = async (
  t: TFunction,
  user: User,
  phoneNumber: PhoneNumber
) => {
  const code = await createSmsCode(user)
  await sendSMS(
    joinPhoneNumber(phoneNumber),
    t('smsVerificationCodeMessage', { code })
  )
}

const isValidAuthenticatorCode = (user: User, code: string) => {
  if (!user.twoFactorAuthSettings?.authenticationSecret) {
    throw new Error('User does not have an authentication secret key')
  }
  const decryptedKey = decryptSecretKey(
    user.twoFactorAuthSettings.authenticationSecret
  )
  return authenticator.check(code, decryptedKey)
}

const isValidSmsCode = (user: User, code: string) => {
  if (!user.twoFactorAuthSettings?.authenticationSecret) {
    throw new Error('User does not have an authentication secret key')
  }
  const decryptedKey = decryptSecretKey(
    user.twoFactorAuthSettings.authenticationSecret
  )
  return smsTotp.check(code, decryptedKey)
}

export const isValidAuthCode = async (
  user: User,
  method: TwoFactorAuthMethod,
  code: string
) => {
  if (method === TwoFactorAuthMethod.SMS) {
    return isValidSmsCode(user, code)
  }

  if (method === TwoFactorAuthMethod.Authenticator) {
    return isValidAuthenticatorCode(user, code)
  }

  return false
}

import { TwoFactorAuthMethod } from 'models/User'
import { ApiErrorCode } from 'utils/error/ApiError'

export enum OAuthProvider {
  Facebook = 'facebook',
  Google = 'google',
  Microsoft = 'microsoft',
  Apple = 'apple',
}

export enum OAuthType {
  SignUp = 'signup',
  Login = 'login',
}

export enum OAuthDevice {
  Mobile = 'mobile',
  Desktop = 'desktop',
}

export interface OAuthResponse {
  accessToken?: string
  tokenType?: string
  expiresIn?: number
  error?: ApiErrorCode
  method?: TwoFactorAuthMethod
}

export interface AppleProfile {
  email: string
}

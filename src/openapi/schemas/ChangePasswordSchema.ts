import { OpenAPIV3_1 } from 'openapi-types'

import { TwoFactorAuthMethod } from 'models/User'

export const ChangePasswordSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  ChangePassword: {
    type: 'object',
    required: ['password', 'token'],
    properties: {
      oldPassword: {
        type: 'string',
        description: 'current/old password of the user',
        example: 'old123',
      },
      newPassword: {
        type: 'string',
        description: 'new password being set by the user',
        example: 'new321',
      },
      otp: {
        description: 'One time password if user has 2FA enabled',
        type: 'string',
        example: '123',
      },
      twoFactorAuthMethod: {
        allOf: [{ $ref: '#/components/schemas/TwoFactorAuthMethod' }],
        description:
          'Which method should be used to authenticate the OTP. Defaults to the preferred method of the user',
        type: 'string',
        example: TwoFactorAuthMethod.Authenticator,
      },
    },
  },
}

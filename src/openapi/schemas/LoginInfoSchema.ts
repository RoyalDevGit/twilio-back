import { OpenAPIV3_1 } from 'openapi-types'

import { TwoFactorAuthMethod } from 'models/User'

export const LoginInfoSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  LoginInfo: {
    type: 'object',
    required: ['emailAddress', 'password'],
    properties: {
      emailAddress: {
        type: 'string',
        format: 'email',
        example: 'test@test.com',
      },
      password: {
        type: 'string',
        example: 'Password!123',
      },
      otp: {
        description: 'One time password',
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

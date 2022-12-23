import { OpenAPIV3_1 } from 'openapi-types'

import { TwoFactorAuthMethod } from 'models/User'
import { getEnumValues } from 'utils/enum/enumUtils'

export const TwoFactorAuthMethodSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  TwoFactorAuthMethod: {
    type: 'integer',
    description: 'Available 2FA methods',
    enum: getEnumValues(TwoFactorAuthMethod),
    example: TwoFactorAuthMethod.Authenticator,
  },
}

export const TwoFactorAuthSettingsSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  TwoFactorAuthSettings: {
    type: 'object',
    required: ['methods', 'preferred'],
    properties: {
      methods: {
        description: 'Array of methods that are enabled by the user',
        type: 'array',
        items: {
          allOf: [{ $ref: '#/components/schemas/TwoFactorAuthMethod' }],
        },
        example: [TwoFactorAuthMethod.Authenticator, TwoFactorAuthMethod.SMS],
      },
      preferred: {
        allOf: [{ $ref: '#/components/schemas/TwoFactorAuthMethod' }],
        description: 'The preferred authentication method of the user',
        type: 'string',
        example: TwoFactorAuthMethod.SMS,
      },
    },
  },
}

export const AuthenticatorInfoSchema: Record<string, OpenAPIV3_1.SchemaObject> =
  {
    AuthenticatorInfo: {
      type: 'object',
      properties: {
        secretKey: {
          description: 'Secret key for authenticator app',
          type: 'string',
          example: 'HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ',
          readOnly: true,
        },
        keyUri: {
          description: 'otpauth url for authenticator app',
          type: 'string',
          example:
            'otpauth://totp/ACME%20Co:john.doe@email.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&issuer=ACME%20Co&algorithm=SHA1&digits=6&period=30',
          readOnly: true,
        },
        qrCodeUrl: {
          description: 'QR code data uri',
          type: 'string',
          example:
            'data:image/gif;base64,R0lGODlhEAAQAMQAAORHHOVSKudfOulrSOp3WOyDZu6QdvCchPGolfO0o/XBs/fNwfjZ0frl3/zy7////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAkAABAALAAAAAAQABAAAAVVICSOZGlCQAosJ6mu7fiyZeKqNKToQGDsM8hBADgUXoGAiqhSvp5QAnQKGIgUhwFUYLCVDFCrKUE1lBavAViFIDlTImbKC5Gm2hB0SlBCBMQiB0UjIQA7',
          readOnly: true,
        },
      },
    },
  }

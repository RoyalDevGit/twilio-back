import { OpenAPIV3_1 } from 'openapi-types'

import { authRouterPathPrefix } from 'routers/AuthRouter'
import { mergeOpenApiPaths } from 'utils/openapi/mergeOpenApiPaths'

const LoginOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/login': {
    post: {
      tags: ['auth'],
      summary: 'Login',
      description: 'Returns access token upon successful user login',
      responses: {
        200: {
          description: 'Successful login',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/TokenResponse' }],
              },
            },
          },
        },
        401: {
          description: 'Email/Password combination do not exist',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        404: {
          description: 'User was not found using the provided email address',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      requestBody: {
        required: true,
        description: 'Login information',
        content: {
          'application/json': {
            schema: {
              allOf: [{ $ref: '#/components/schemas/LoginInfo' }],
            },
          },
        },
      },
    },
  },
}

const SignupOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/signup': {
    post: {
      tags: ['auth'],
      summary: 'Signup',
      description: 'Returns access token upon successful user signup',
      responses: {
        201: {
          description: 'Successful signup',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/TokenResponse' }],
              },
            },
          },
        },
        400: {
          description: 'Signup was not successful',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      requestBody: {
        required: true,
        description: 'Signup information',
        content: {
          'application/json': {
            schema: {
              allOf: [{ $ref: '#/components/schemas/SignupInfo' }],
            },
          },
        },
      },
    },
  },
}

const EmailVerificationOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/verify-email': {
    patch: {
      tags: ['auth'],
      summary: 'Email Address Verification',
      description: 'Marks an email address of a user as verified',
      responses: {
        204: {
          description: 'Email address was marked as verified successfully',
        },
        400: {
          description: 'Email address was not successfully verified',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      requestBody: {
        required: true,
        description: 'Email verification request body',
        content: {
          'application/json': {
            schema: {
              allOf: [{ $ref: '#/components/schemas/EmailVerificationBody' }],
            },
          },
        },
      },
    },
  },
}

const SendResetPasswordLinkOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/send-password-reset-link': {
    post: {
      tags: ['auth'],
      summary: 'Send Password Reset Link',
      description:
        'Sends an email to the user containing an email to reset their password',
      responses: {
        204: {
          description: 'Password reset email was sent successfully',
        },
        404: {
          description: 'Email address was not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      requestBody: {
        required: true,
        description: 'Email verification request body',
        content: {
          'application/json': {
            schema: {
              allOf: [
                { $ref: '#/components/schemas/SendResetPasswordLinkBody' },
              ],
            },
          },
        },
      },
    },
  },
}

const ResetPasswordOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/reset-password': {
    put: {
      tags: ['auth'],
      summary: 'Reset Password',
      description: 'Returns access token upon successful password reset',
      responses: {
        200: {
          description: 'Successful password reset',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/TokenResponse' }],
              },
            },
          },
        },
        404: {
          description: 'User was not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        401: {
          description: 'The token is invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        410: {
          description: 'The token is expired',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      requestBody: {
        required: true,
        description: 'Password reset request body',
        content: {
          'application/json': {
            schema: {
              allOf: [{ $ref: '#/components/schemas/PasswordResetBody' }],
            },
          },
        },
      },
    },
  },
}

const ChangePasswordOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/change-password': {
    put: {
      tags: ['auth'],
      summary: 'Change Password',
      description: 'Changes the password of an already authenticated user',
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        204: {
          description: 'Successful password change',
        },
        404: {
          description: 'User was not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        401: {
          description: 'The token is invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        410: {
          description: 'The token is expired',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      requestBody: {
        required: true,
        description: 'Change password request body',
        content: {
          'application/json': {
            schema: {
              allOf: [{ $ref: '#/components/schemas/ChangePassword' }],
            },
          },
        },
      },
    },
  },
}

const SendSmsAuthCodeOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/send-sms-auth-code': {
    post: {
      tags: ['auth'],
      summary: 'Send SMS Auth Code',
      description: 'Sends an SMS authorization code to the current user',
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        204: {
          description: 'SMS was sent successfully',
        },
        401: {
          description: 'Email/Password combination do not exist',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      requestBody: {
        description: 'Login information',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                phoneNumber: {
                  allOf: [{ $ref: '#/components/schemas/PhoneNumber' }],
                },
              },
            },
          },
        },
      },
    },
  },
}

const AuthenticatorInfoOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/authenticator-info': {
    get: {
      tags: ['auth'],
      summary: 'Get Authenticator App Info',
      description: 'Gets information for the authenticator app',
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          description:
            'Object containing information for the authenticator app',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/AuthenticatorInfo' }],
              },
            },
          },
        },
        401: {
          description: 'Unauthorized user',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
    },
  },
}

const CreateGuestUserOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/guest-user': {
    post: {
      tags: ['auth'],
      summary: 'Create Guest User',
      description: 'Creates a temporary guest user',
      security: [
        {
          apiKeyAuth: [],
        },
      ],
      responses: {
        201: {
          description: 'Successful guest user creation',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/TokenResponse' }],
              },
            },
          },
        },
        400: {
          description: 'Creating the guest user was not successful',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      requestBody: {
        required: true,
        description: 'Guest user data',
        content: {
          'application/json': {
            schema: {
              allOf: [{ $ref: '#/components/schemas/CreateGuestUser' }],
            },
          },
        },
      },
    },
  },
}

export const AuthPath = mergeOpenApiPaths(
  [
    LoginOperation,
    SignupOperation,
    EmailVerificationOperation,
    SendResetPasswordLinkOperation,
    ResetPasswordOperation,
    SendSmsAuthCodeOperation,
    AuthenticatorInfoOperation,
    ChangePasswordOperation,
    CreateGuestUserOperation,
  ],
  {
    pathPrefix: authRouterPathPrefix,
  }
)

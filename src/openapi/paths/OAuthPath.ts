import { OpenAPIV3_1 } from 'openapi-types'

import { OAuthProvider, OAuthType } from 'interfaces/OAuth'
import { UserRole } from 'models/User'
import { mergeOpenApiPaths } from 'utils/openapi/mergeOpenApiPaths'

function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const generatePaths = (
  path: OAuthType,
  role: UserRole,
  provider: OAuthProvider
): OpenAPIV3_1.PathsObject[] => {
  const proverDisplayName: string = capitalizeFirstLetter(provider)
  const pathDisplayName: string = capitalizeFirstLetter(path)
  const roleDisplayName: string = capitalizeFirstLetter(role)
  return [
    {
      [`/${provider}/${path}/${role}`]: {
        get: {
          tags: ['oauth'],
          summary: `${proverDisplayName} ${roleDisplayName} ${pathDisplayName}`,
          description: `Redirects the user to ${proverDisplayName}'s login page`,
          responses: {
            200: {
              description: `Successful redirect to ${proverDisplayName}`,
            },
          },
        },
      },
    },
    {
      [`/${provider}/${path}/${role}/redirect`]: {
        get: {
          tags: ['oauth'],
          summary: `${proverDisplayName} ${roleDisplayName} ${pathDisplayName} (Auth)`,
          description: `The frontend will receive the token response from ${proverDisplayName} and pass it along to this endpoint. It will extract out the user data embedded in ${proverDisplayName}'s token and either create or fetch the user based on the respective email.`,
          responses: {
            200: {
              description: 'Successful Authentication',
              content: {
                'application/json': {
                  schema: {
                    allOf: [{ $ref: '#/components/schemas/TokenResponse' }],
                  },
                },
              },
            },
          },
        },
      },
    },
  ]
}

const generateTemplate = (provider: OAuthProvider) => [
  ...generatePaths(OAuthType.Login, UserRole.Consumer, provider),
  ...generatePaths(OAuthType.SignUp, UserRole.Consumer, provider),
  ...generatePaths(OAuthType.SignUp, UserRole.Expert, provider),
]

export const OAuthPath = mergeOpenApiPaths(
  [
    ...generateTemplate(OAuthProvider.Facebook),
    ...generateTemplate(OAuthProvider.Google),
    ...generateTemplate(OAuthProvider.Microsoft),
    ...generateTemplate(OAuthProvider.Apple),
  ],
  {
    pathPrefix: 'oauth',
  }
)

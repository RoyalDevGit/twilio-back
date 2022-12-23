import { OpenAPIV3_1 } from 'openapi-types'

import { allParameters } from 'openapi/parameters'
import { allPaths } from 'openapi/paths'
import { allSchemas } from 'openapi/schemas'

export const OpenApiSpec: OpenAPIV3_1.Document = {
  openapi: '3.0.0',
  info: {
    title: 'Expert Session API',
    description: 'Expert Session API docs',
    version: '1.0',
  },
  paths: allPaths,
  components: {
    schemas: allSchemas,
    parameters: allParameters,
    securitySchemes: {
      bearerToken: {
        description: 'Bearer Token',
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-KEY',
      },
    },
  },
}

import { OpenAPIV3_1 } from 'openapi-types'

import { expertRouterPathPrefix } from 'routers/ExpertRouter'
import { mergeOpenApiPaths } from 'utils/openapi/mergeOpenApiPaths'

const CreateExpertOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{userId}': {
    post: {
      summary: 'Create Expert',
      description: 'Converts an existing user to an expert',
      tags: ['experts'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        201: {
          description: 'New Expert that was successfully created',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/Expert' }],
              },
            },
          },
        },
        409: {
          description: 'User was already an expert',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [{ allOf: [{ $ref: '#/components/parameters/UserId' }] }],
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              allOf: [{ $ref: '#/components/schemas/ExpertUpdate' }],
            },
          },
        },
      },
    },
  },
}

const ExpertByIdOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{expertId}': {
    get: {
      summary: 'Get Expert',
      description: 'Gets an existing expert by ID',
      tags: ['experts'],
      security: [
        {
          apiKeyAuth: [],
        },
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/Expert' }],
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [{ allOf: [{ $ref: '#/components/parameters/ExpertId' }] }],
    },
    patch: {
      summary: 'Update Expert',
      description: 'Updates an existing expert',
      tags: ['experts'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          description: 'Updated expert',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/Expert' }],
              },
            },
          },
        },
        404: {
          description: 'Expert not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [{ allOf: [{ $ref: '#/components/parameters/ExpertId' }] }],
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              allOf: [{ $ref: '#/components/schemas/ExpertUpdate' }],
            },
          },
        },
      },
    },
  },
}

const CurrentExpertOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/me': {
    get: {
      summary: 'Current Expert Profile',
      description: "Returns the current user's expert profile information",
      tags: ['experts'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/Expert' }],
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
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

const Favorites: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/favorites': {
    get: {
      summary: 'Get all Favorited Experts',
      description: 'Get all Favorited Experts',
      tags: ['experts'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          description: 'Updated expert',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/Expert' }],
              },
            },
          },
        },
        409: {
          description: 'Expert has already been favorited by this user',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        404: {
          description: 'Expert not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [{ allOf: [{ $ref: '#/components/parameters/ExpertId' }] }],
    },
  },
}

const FavoriteOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{expertId}/favorite': {
    patch: {
      summary: 'Favorite Expert',
      description: 'Mark the expert as favorited by the current user',
      tags: ['experts'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          description: 'Updated expert',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/Expert' }],
              },
            },
          },
        },
        409: {
          description: 'Expert has already been favorited by this user',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        404: {
          description: 'Expert not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [{ allOf: [{ $ref: '#/components/parameters/ExpertId' }] }],
    },
  },
}

const UnfavoriteOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{expertId}/unfavorite': {
    patch: {
      summary: 'Unfavorite Expert',
      description: 'Mark the expert as favorited by the current user',
      tags: ['experts'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          description: 'Updated expert',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/Expert' }],
              },
            },
          },
        },
        404: {
          description: 'Expert not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [{ allOf: [{ $ref: '#/components/parameters/ExpertId' }] }],
    },
  },
}

const QueryExpertsOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/': {
    get: {
      summary: 'Query Experts',
      description: 'Queries all experts',
      tags: ['experts'],
      security: [
        {
          apiKeyAuth: [],
        },
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          description: 'Experts query return',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/QueryResponse' }],
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [
        { allOf: [{ $ref: '#/components/parameters/Page' }] },
        { allOf: [{ $ref: '#/components/parameters/Limit' }] },
        { allOf: [{ $ref: '#/components/parameters/Favorites' }] },
        { allOf: [{ $ref: '#/components/parameters/VerifiedFilter' }] },
        { allOf: [{ $ref: '#/components/parameters/OnlineNowFilter' }] },
        { allOf: [{ $ref: '#/components/parameters/CategoryFilter' }] },
        { allOf: [{ $ref: '#/components/parameters/LanguageFilter' }] },
        { allOf: [{ $ref: '#/components/parameters/ExpertRateFilter' }] },
        { allOf: [{ $ref: '#/components/parameters/ExpertRatingFilter' }] },
      ],
    },
  },
}

const SearchExpertsOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/search': {
    get: {
      summary: 'Search Experts',
      description: 'Search for experts',
      tags: ['experts'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          description: 'List of experts returned by the search',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/SearchResult' }],
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [
        { allOf: [{ $ref: '#/components/parameters/SearchQuery' }] },
      ],
    },
  },
}

const ExpertEventsOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{expertId}/events': {
    post: {
      summary: 'Create Event',
      description: 'Creates a new event under a expert',
      tags: ['events'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        201: {
          description: 'Successful creation',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/Event' }],
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [{ allOf: [{ $ref: '#/components/parameters/ExpertId' }] }],
      requestBody: {
        required: true,
        description: 'Event data',
        content: {
          'application/json': {
            schema: { allOf: [{ $ref: '#/components/schemas/EventCreation' }] },
          },
        },
      },
    },
    get: {
      summary: 'Query Events',
      description: 'Queries events under a expert',
      tags: ['events'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          description: 'Query Results',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  allOf: [{ $ref: '#/components/schemas/Event' }],
                },
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [
        { allOf: [{ $ref: '#/components/parameters/ExpertId' }] },
        { allOf: [{ $ref: '#/components/parameters/FromDate' }] },
        { allOf: [{ $ref: '#/components/parameters/ToDate' }] },
      ],
    },
  },
}

const VideoOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{expertId}/videos': {
    post: {
      summary: 'Upload Video',
      description:
        'Uploads a new video to the expert and returns the uploaded video object',
      tags: ['videos'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/Video' }],
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [{ allOf: [{ $ref: '#/components/parameters/ExpertId' }] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              allOf: [{ $ref: '#/components/schemas/VideoUpload' }],
            },
          },
        },
      },
    },
  },
}

const ReviewEligibilityOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{expertId}/review-eligibility': {
    get: {
      summary: 'Review Eligibility',
      description: 'Check if the current user can review the expert',
      tags: ['experts'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          content: {
            'application/json': {
              schema: {
                type: 'boolean',
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        404: {
          description: 'Expert not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [{ allOf: [{ $ref: '#/components/parameters/ExpertId' }] }],
    },
  },
}

const AvailabilityOptionOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{expertId}/availability-options': {
    post: {
      summary: 'Create Availability Option',
      description: 'Create a new availability option for the expert',
      tags: ['experts'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        201: {
          description: 'Availability option was created',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/AvailabilityOption' }],
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        409: {
          description: 'Availability already exists for the specified weekday',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        404: {
          description: 'Expert not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [{ allOf: [{ $ref: '#/components/parameters/ExpertId' }] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              allOf: [{ $ref: '#/components/schemas/AvailabilityOption' }],
            },
          },
        },
      },
    },
    get: {
      summary: 'Get Availability Options',
      description: 'Get all availability options configured by the expert',
      tags: ['experts'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          description: 'Availability options',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  allOf: [{ $ref: '#/components/schemas/AvailabilityOption' }],
                },
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        404: {
          description: 'Expert not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [{ allOf: [{ $ref: '#/components/parameters/ExpertId' }] }],
    },
  },
}

const ApplyToAllOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{expertId}/availability-options/apply-to-all': {
    post: {
      summary: 'Apply Option To All Weekdays',
      description:
        'Applies an existing availability option to all other weekdays and returns all the options',
      tags: ['experts'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          description: 'All availability options after the copy was done',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  allOf: [{ $ref: '#/components/schemas/AvailabilityOption' }],
                },
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        409: {
          description: 'Availability already exists for the specified weekday',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        404: {
          description: 'Expert not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [{ allOf: [{ $ref: '#/components/parameters/ExpertId' }] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              allOf: [
                {
                  $ref: '#/components/schemas/ApplyToAllAvailabilityOptionsBody',
                },
              ],
            },
          },
        },
      },
    },
  },
}

const AvailabilityOptionByIdOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{expertId}/availability-options/{availabilityId}': {
    patch: {
      summary: 'Update Availability Option',
      description: 'Updates an existing availability option',
      tags: ['experts'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          description: 'Availability option was updated',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/AvailabilityOption' }],
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        404: {
          description: 'Expert or availability not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [
        { allOf: [{ $ref: '#/components/parameters/ExpertId' }] },
        { allOf: [{ $ref: '#/components/parameters/AvailabilityOptionId' }] },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              allOf: [{ $ref: '#/components/schemas/AvailabilityOption' }],
            },
          },
        },
      },
    },
  },
}

const SessionDurationOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{expertId}/session-duration-options': {
    post: {
      summary: 'Create Session Duration Option',
      description: 'Create a new session duration option for the expert',
      tags: ['experts'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        201: {
          description: 'Duration option was created',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/SessionDurationOption' }],
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        409: {
          description: 'Duration option already exists',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        404: {
          description: 'Expert not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [{ allOf: [{ $ref: '#/components/parameters/ExpertId' }] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              allOf: [{ $ref: '#/components/schemas/SessionDurationOption' }],
            },
          },
        },
      },
    },
    get: {
      summary: 'Get Session Duration Options',
      description: 'Get all session duration options configured by the expert',
      tags: ['experts'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          description: 'Session duration options',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  allOf: [
                    { $ref: '#/components/schemas/SessionDurationOption' },
                  ],
                },
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        404: {
          description: 'Expert or duration option not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [{ allOf: [{ $ref: '#/components/parameters/ExpertId' }] }],
    },
  },
}

const SessionDurationByIdOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{expertId}/session-duration-options/{sessionDurationId}': {
    patch: {
      summary: 'Update Session Duration Option',
      description: 'Updates an existing session duration option',
      tags: ['experts'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          description: 'Session duration option was updated',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/SessionDurationOption' }],
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        404: {
          description: 'Expert not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [
        { allOf: [{ $ref: '#/components/parameters/ExpertId' }] },
        {
          allOf: [{ $ref: '#/components/parameters/SessionDurationOptionId' }],
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              allOf: [{ $ref: '#/components/schemas/SessionDurationOption' }],
            },
          },
        },
      },
    },
    delete: {
      summary: 'Delete Session Duration Option',
      description: 'Deletes an existing session duration option',
      tags: ['experts'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        204: {
          description: 'Session duration option was deleted',
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        404: {
          description: 'Expert or duration option not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [
        { allOf: [{ $ref: '#/components/parameters/ExpertId' }] },
        {
          allOf: [{ $ref: '#/components/parameters/SessionDurationOptionId' }],
        },
      ],
    },
  },
}

const BlockoutDateOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{expertId}/blockout-dates': {
    post: {
      summary: 'Create Blockout Date',
      description: 'Create a new blockout date for the expert',
      tags: ['experts'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        201: {
          description: 'Blockout date was created',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/BlockoutDate' }],
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        409: {
          description: 'Blockout date already exists',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        404: {
          description: 'Expert not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [{ allOf: [{ $ref: '#/components/parameters/ExpertId' }] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              allOf: [{ $ref: '#/components/schemas/BlockoutDate' }],
            },
          },
        },
      },
    },
    get: {
      summary: 'Get Blockout Dates',
      description: 'Get all blockout dates configured by the expert',
      tags: ['experts'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          description: 'List of blockout dates',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  allOf: [{ $ref: '#/components/schemas/BlockoutDate' }],
                },
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        404: {
          description: 'Expert or blockout date not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [{ allOf: [{ $ref: '#/components/parameters/ExpertId' }] }],
    },
  },
}

const BlockoutDateByIdOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{expertId}/blockout-dates/{blockoutDateId}': {
    delete: {
      summary: 'Delete Blockout Date',
      description: 'Deletes an existing blockout date',
      tags: ['experts'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        204: {
          description: 'Blockout date was deleted',
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        404: {
          description: 'Expert or blockout date not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [
        { allOf: [{ $ref: '#/components/parameters/ExpertId' }] },
        { allOf: [{ $ref: '#/components/parameters/BlockoutDateId' }] },
      ],
    },
  },
}

const AvailabilityOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{expertId}/availability': {
    get: {
      summary: 'Get Expert Availability',
      description: 'Get availability of an expert based on a date range',
      tags: ['experts'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ExpertAvailability' }],
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        404: {
          description: 'Expert not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [
        { allOf: [{ $ref: '#/components/parameters/ExpertId' }] },
        { allOf: [{ $ref: '#/components/parameters/FromDate' }] },
        { allOf: [{ $ref: '#/components/parameters/ToDate' }] },
        { allOf: [{ $ref: '#/components/parameters/AvailabilityDate' }] },
        { allOf: [{ $ref: '#/components/parameters/AvailabilityDuration' }] },
      ],
    },
  },
}

const InstantAvailabilityOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{expertId}/availability/instant': {
    get: {
      summary: 'Get Instant Availability',
      description: 'Get instant availability of an expert',
      tags: ['experts'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          content: {
            'application/json': {
              schema: {
                allOf: [
                  {
                    $ref: '#/components/schemas/ExpertInstantAvailability',
                  },
                ],
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        404: {
          description: 'Expert not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [
        { allOf: [{ $ref: '#/components/parameters/ExpertId' }] },
        { allOf: [{ $ref: '#/components/parameters/IgnoreActiveSession' }] },
      ],
    },
  },
}

const FeaturedExpertsOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/featured': {
    get: {
      summary: 'Featured Experts',
      description: 'Gets featured experts',
      tags: ['experts'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          description: 'Experts query return',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/QueryResponse' }],
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [
        { allOf: [{ $ref: '#/components/parameters/Page' }] },
        { allOf: [{ $ref: '#/components/parameters/Limit' }] },
        { allOf: [{ $ref: '#/components/parameters/VerifiedFilter' }] },
        { allOf: [{ $ref: '#/components/parameters/OnlineNowFilter' }] },
        { allOf: [{ $ref: '#/components/parameters/CategoryFilter' }] },
        { allOf: [{ $ref: '#/components/parameters/LanguageFilter' }] },
        { allOf: [{ $ref: '#/components/parameters/ExpertRateFilter' }] },
        { allOf: [{ $ref: '#/components/parameters/ExpertRatingFilter' }] },
      ],
    },
  },
}

const RecommendedExpertsOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/recommended': {
    get: {
      summary: 'Recommended Experts',
      description: 'Gets recommended experts',
      tags: ['experts'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          description: 'Experts query return',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/QueryResponse' }],
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [
        { allOf: [{ $ref: '#/components/parameters/Page' }] },
        { allOf: [{ $ref: '#/components/parameters/Limit' }] },
        { allOf: [{ $ref: '#/components/parameters/VerifiedFilter' }] },
        { allOf: [{ $ref: '#/components/parameters/OnlineNowFilter' }] },
        { allOf: [{ $ref: '#/components/parameters/CategoryFilter' }] },
        { allOf: [{ $ref: '#/components/parameters/LanguageFilter' }] },
        { allOf: [{ $ref: '#/components/parameters/ExpertRateFilter' }] },
        { allOf: [{ $ref: '#/components/parameters/ExpertRatingFilter' }] },
      ],
    },
  },
}

const ReindexOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/reindex': {
    post: {
      summary: 'Reindex Experts',
      description: 'Updates all experts in the open search index',
      tags: ['experts'],
      security: [
        {
          apiKeyAuth: [],
        },
      ],
      responses: {
        204: {
          description: 'Reindex was successful',
        },
        400: {
          description: 'Bad Request',
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

export const ExpertPath = mergeOpenApiPaths(
  [
    CreateExpertOperation,
    ExpertByIdOperations,
    QueryExpertsOperation,
    ExpertEventsOperations,
    VideoOperations,
    ReviewEligibilityOperations,
    Favorites,
    FavoriteOperation,
    UnfavoriteOperation,
    AvailabilityOptionOperations,
    AvailabilityOptionByIdOperations,
    SessionDurationOperations,
    SessionDurationByIdOperations,
    CurrentExpertOperation,
    BlockoutDateOperations,
    BlockoutDateByIdOperations,
    AvailabilityOperations,
    InstantAvailabilityOperations,
    SearchExpertsOperation,
    FeaturedExpertsOperation,
    RecommendedExpertsOperation,
    ApplyToAllOperation,
    ReindexOperation,
  ],
  {
    pathPrefix: expertRouterPathPrefix,
  }
)

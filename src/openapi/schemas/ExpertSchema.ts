import { OpenAPIV3_1 } from 'openapi-types'

import { ExpertIntroWizardStatus } from 'models/Expert'
import { getEnumValues } from 'utils/enum/enumUtils'

export const ExpertIntroWizardStatusSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  ExpertIntroWizardStatus: {
    type: 'string',
    description: 'Possible status of the expert intro wizard',
    enum: getEnumValues(ExpertIntroWizardStatus),
    example: ExpertIntroWizardStatus.Completed,
  },
}

export const ExpertSocialMediaLinksSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  ExpertSocialMediaLinks: {
    type: 'object',
    properties: {
      facebook: {
        type: 'string',
        description: "URL of expert's Facebook profile",
        example: 'https://www.facebook.com/my-profile',
      },
      twitter: {
        type: 'string',
        description: "URL of expert's Twitter profile",
        example: 'https://www.twitter.com/my-profile',
      },
      linkedIn: {
        type: 'string',
        description: "URL of expert's LinkedIn profile",
        example: 'https://www.linkedin.com/my-profile',
      },
      youTube: {
        type: 'string',
        description: "URL of expert's Facebook profile",
        example: 'https://www.youtube.com/my-profile',
      },
      instagram: {
        type: 'string',
        description: "URL of expert's Facebook profile",
        example: 'https://www.instagram.com/my-profile',
      },
    },
  },
}

export const ExpertSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  Expert: {
    type: 'object',
    required: [
      'phoneNumber',
      'description',
      'mainAreaOfExpertise',
      'location',
      'expertiseTags',
      'languages',
      'bannerImage',
      'expertSince',
      'status',
    ],
    properties: {
      id: {
        description: 'Auto generated UUID',
        readOnly: true,
        type: 'string',
        example: '620656c02c5e77db620a67d7',
      },
      description: {
        description:
          'Map object holding the expert description in multiple languages. The keys of the object are the ISO 639-3 language identifiers and the values are the actual expert descriptions',
        type: 'object',
        example: {
          eng: 'I am an expert and I specialize in this and that',
          spa: 'Soy un experto y me especializo en esto y aquello.',
        },
      },
      mainAreaOfExpertise: {
        description: 'Main area of expertise of the expert',
        type: 'string',
        example: 'Film Director',
      },
      location: {
        description: 'Location of the expert',
        type: 'string',
        example: 'New York, NY',
      },
      hourlyRate: {
        description: 'Hourly rate of the expert',
        type: 'boolean',
        example: 10.5,
      },
      noticePeriod: {
        description:
          'Total notice period in minutes that an expert requires. For example, if set to 60, a consumer will only be able to book sessions with the expert, one hour into the future or more.',
        type: 'integer',
        example: 1440,
      },
      expertiseCategories: {
        description: 'Areas of expertise of the expert',
        type: 'array',
        items: {
          type: 'string',
        },
        example: ['Civil Engineering', 'Architecture'],
      },
      educations: {
        description: 'Past education of the expert',
        type: 'array',
        items: {
          type: 'string',
        },
        example: ['MassArt 2002', 'Yale'],
      },
      experiences: {
        description: 'Past experience of the expert',
        type: 'array',
        items: {
          type: 'string',
        },
        example: ['Self-Employed', 'Some Company'],
      },
      tags: {
        description:
          'Words and phrases used that give context about the expert',
        type: 'array',
        items: {
          type: 'string',
        },
        example: ['tag1', 'tag2'],
      },
      languages: {
        description:
          'Languages known by the expert represented by their ISO 639-3 language identifier',
        type: 'array',
        items: {
          type: 'string',
        },
        example: ['eng', 'spa'],
      },
      bannerImage: {
        description: 'Url of user profile picture',
        readOnly: true,
        allOf: [{ $ref: '#/components/schemas/FileTracker' }],
      },
      expertSince: {
        description: 'Date that the user became an expert',
        type: 'string',
        format: 'date-time',
        example: '2022-02-16T00:00:00Z',
        readOnly: true,
      },
      verified: {
        description: 'Whether the expert profile has been verified',
        type: 'boolean',
        example: true,
      },
      followerCount: {
        description: 'Number of people that follow this expert',
        type: 'integer',
        example: 500,
        readOnly: true,
      },
      followingCount: {
        description: 'Number of people that the expert follows',
        type: 'integer',
        example: 50,
        readOnly: true,
      },
      user: {
        allOf: [{ $ref: '#/components/schemas/User' }],
        readOnly: true,
      },
      introVideo: {
        description:
          'Reference to a video record that the user selected as their introduction video',
        allOf: [{ $ref: '#/components/schemas/Video' }],
      },
      totalFavorites: {
        description: 'Total times this expert has been favorited',
        type: 'integer',
        example: 458,
        readOnly: true,
      },
      isFavorite: {
        description: 'Whether the current user has favorited this expert',
        type: 'boolean',
        example: true,
        readOnly: true,
      },
      introWizardStatus: {
        description: 'Current status of the expert',
        $ref: '#/components/schemas/ExpertIntroWizardStatus',
        default: ExpertIntroWizardStatus.NotStarted,
        example: ExpertIntroWizardStatus.Completed,
      },
      averageRatings: {
        description: 'Average ratings of the expert',
        allOf: [{ $ref: '#/components/schemas/AverageRatings' }],
        readOnly: true,
      },
    },
  },
}

export const ExpertUpdateSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  ExpertUpdate: {
    type: 'object',
    properties: {
      bannerImage: {
        description: 'Banner image file to upload',
        type: 'string',
        format: 'binary',
      },
      expertData: {
        allOf: [{ $ref: '#/components/schemas/Expert' }],
      },
    },
  },
}

export const ExpertAvailableTimeSlotSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  ExpertAvailableTimeSlot: {
    type: 'object',
    properties: {
      id: {
        description: 'Auto generated UUID',
        readOnly: true,
        type: 'string',
        example: '620656c02c5e77db620a67d7',
      },
      date: {
        description: 'Date of availability time slot',
        type: 'string',
        format: 'date-time',
        example: '2022-02-16T00:00:00Z',
        readOnly: true,
      },
      duration: {
        description: 'Total duration of availability slot in minutes',
        type: 'integer',
        example: 45,
        readOnly: true,
      },
      startDate: {
        description: 'Start date and time of availability time slot',
        type: 'string',
        format: 'date-time',
        example: '2022-02-16T00:00:00Z',
        readOnly: true,
      },
      endDate: {
        description: 'End date and time of availability time slot',
        type: 'string',
        format: 'date-time',
        example: '2022-02-16T00:45:00Z',
        readOnly: true,
      },
      price: {
        allOf: [{ $ref: '#/components/schemas/Price' }],
        readOnly: true,
      },
    },
  },
}

export const ExpertAvailableDurationSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  ExpertAvailableDuration: {
    type: 'object',
    properties: {
      minutes: {
        description: 'Total duration of availability slot in minutes',
        type: 'integer',
        example: 45,
        readOnly: true,
      },
      price: {
        allOf: [{ $ref: '#/components/schemas/Price' }],
        readOnly: true,
      },
    },
  },
}

export const ExpertAvailabilitySchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  ExpertAvailability: {
    type: 'object',
    properties: {
      hash: {
        description:
          'Hash generated from object contents. This is to be used by clients to see if the availability has changed without having to do deep equality checks.',
        type: 'string',
        example: '67b69634f9880a282c14a0f0cb7ba20cf5d677e9',
        readOnly: true,
      },
      from: {
        description: 'Start date of query',
        type: 'string',
        format: 'date-time',
        example: '2022-02-16T00:00:00Z',
        readOnly: true,
      },
      to: {
        description: 'End date of availability query',
        type: 'string',
        format: 'date-time',
        example: '2022-02-16T00:00:00Z',
        readOnly: true,
      },
      selectedDate: {
        description: 'Date selected in query',
        type: 'string',
        format: 'date-time',
        example: '2022-02-16T00:00:00Z',
        readOnly: true,
      },
      selectedDuration: {
        description: 'Duration in minutes selected in query',
        type: 'integer',
        example: 45,
        readOnly: true,
      },
      dates: {
        description: 'List of available dates returned by the query',
        type: 'array',
        items: { type: 'string', format: 'date-time' },
        example: ['2022-02-16T00:00:00Z'],
        readOnly: true,
      },
      durations: {
        description: 'List of available durations returned by the query',
        type: 'array',
        items: {
          allOf: [{ $ref: '#/components/schemas/ExpertAvailableTimeSlot' }],
        },
        readOnly: true,
      },
      timeSlots: {
        description: 'List of available time slots returned by the query',
        type: 'array',
        items: {
          allOf: [{ $ref: '#/components/schemas/ExpertAvailableTimeSlot' }],
        },
        readOnly: true,
      },
      instant: {
        type: 'object',
        properties: {
          durations: {
            description: 'List of available instant session durations',
            type: 'array',
            items: {
              allOf: [{ $ref: '#/components/schemas/ExpertAvailableTimeSlot' }],
            },
            readOnly: true,
          },
        },
      },
    },
  },
}

export const ExpertInstantAvailabilitySchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  ExpertInstantAvailability: {
    type: 'object',
    properties: {
      hash: {
        description:
          'Hash generated from object contents. This is to be used by clients to see if the availability has changed without having to do deep equality checks.',
        type: 'string',
        example: '67b69634f9880a282c14a0f0cb7ba20cf5d677e9',
        readOnly: true,
      },
      from: {
        description: 'Start date of query',
        type: 'string',
        format: 'date-time',
        example: '2022-02-16T00:00:00Z',
        readOnly: true,
      },
      to: {
        description: 'End date of availability query',
        type: 'string',
        format: 'date-time',
        example: '2022-02-16T00:00:00Z',
        readOnly: true,
      },
      selectedDate: {
        description: 'Date selected in query',
        type: 'string',
        format: 'date-time',
        example: '2022-02-16T00:00:00Z',
        readOnly: true,
      },
      selectedDuration: {
        description: 'Duration in minutes selected in query',
        type: 'integer',
        example: 45,
        readOnly: true,
      },
      dates: {
        description: 'List of available dates returned by the query',
        type: 'array',
        items: { type: 'string', format: 'date-time' },
        example: ['2022-02-16T00:00:00Z'],
        readOnly: true,
      },
      durations: {
        description: 'List of available durations returned by the query',
        type: 'array',
        items: {
          allOf: [{ $ref: '#/components/schemas/ExpertAvailableTimeSlot' }],
        },
        readOnly: true,
      },
      timeSlots: {
        description: 'List of available time slots returned by the query',
        type: 'array',
        items: {
          allOf: [{ $ref: '#/components/schemas/ExpertAvailableTimeSlot' }],
        },
        readOnly: true,
      },
      instant: {
        type: 'object',
        properties: {
          durations: {
            description: 'List of available instant session durations',
            type: 'array',
            items: {
              allOf: [{ $ref: '#/components/schemas/ExpertAvailableTimeSlot' }],
            },
            readOnly: true,
          },
        },
      },
    },
  },
}

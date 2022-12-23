import { OpenAPIV3_1 } from 'openapi-types'

import { ColorSchemePreference, UserRole, UserStatus } from 'models/User'
import { getEnumValues } from 'utils/enum/enumUtils'

export const UserStatusUpdateSchema: Record<string, OpenAPIV3_1.SchemaObject> =
  {
    UserStatusUpdate: {
      type: 'object',
      required: ['status'],
      properties: {
        status: {
          description: 'New status to set',
          allOf: [{ $ref: '#/components/schemas/UserStatus' }],
          default: UserStatus.Unknown,
          example: UserStatus.Available,
        },
      },
    },
  }

export const ColorSchemePreferenceSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  ColorSchemePreference: {
    type: 'string',
    description: 'UI color scheme',
    enum: getEnumValues(ColorSchemePreference),
    example: ColorSchemePreference.Dark,
  },
}

export const UserSettingsSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  UserSettings: {
    type: 'object',
    properties: {
      colorScheme: {
        description: 'Preferred color scheme of the user',
        allOf: [{ $ref: '#/components/schemas/ColorSchemePreference' }],
      },
      language: {
        type: 'string',
        description:
          'Preferred language of the user represented in the ISO 639-3 language identifier',
        example: 'eng',
      },
      timeZone: {
        type: 'string',
        description: 'Preferred timezone of the user',
        example: 'America/New_York',
      },
    },
  },
}

export const UserRoleSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  UserRole: {
    type: 'string',
    description: 'Possible roles a user can have',
    enum: getEnumValues(UserRole),
    example: UserRole.Consumer,
  },
}

export const UserSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  User: {
    type: 'object',
    required: ['firstName', 'lastName', 'emailAddress'],
    properties: {
      id: {
        description: 'Auto generated UUID',
        readOnly: true,
        type: 'string',
        example: '620656c02c5e77db620a67d7',
      },
      roles: {
        description: 'Array containing all the roles of the user',
        type: 'array',
        items: {
          allOf: [{ $ref: '#/components/schemas/UserRole' }],
        },
        default: [UserRole.Consumer],
        example: [UserRole.Consumer, UserRole.Expert],
      },
      firstName: {
        type: 'string',
        example: 'John',
      },
      lastName: {
        type: 'string',
        example: 'Doe',
      },
      emailAddress: {
        type: 'string',
        format: 'email',
        example: 'test@test.com',
      },
      mobilePhoneNumber: {
        allOf: [{ $ref: '#/components/schemas/PhoneNumber' }],
      },
      emailVerificationStartDate: {
        type: 'string',
        format: 'date',
        example: '2022-02-16T00:00:00Z',
        readOnly: true,
      },
      emailVerified: {
        type: 'boolean',
        example: true,
        readOnly: true,
      },
      profilePicture: {
        description: 'Url of user profile picture',
        allOf: [{ $ref: '#/components/schemas/FileTracker' }],
      },
      createdBy: {
        type: 'string',
        description: 'UUID of user that created this user',
        example: '620656c02c5e77db620a67d7',
        readOnly: true,
      },
      joined: {
        type: 'string',
        format: 'date-time',
        example: '2022-02-16T00:00:00Z',
        readOnly: true,
      },
      settings: {
        description: 'Settings of the user',
        allOf: [{ $ref: '#/components/schemas/UserSettings' }],
      },
      averageRatings: {
        description: 'Average ratings of the user',
        allOf: [{ $ref: '#/components/schemas/AverageRatings' }],
        readOnly: true,
      },
      areasOfInterest: {
        description: 'Areas of interest of the consumer',
        type: 'array',
        items: {
          type: 'string',
        },
        example: ['Plumbling', 'Handyman'],
      },
      twoFactorAuthSettings: {
        description: '2FA settings',
        $ref: '#/components/schemas/TwoFactorAuthSettings',
      },
      status: {
        description: 'Current status of the user',
        allOf: [{ $ref: '#/components/schemas/UserStatus' }],
        default: UserStatus.Unknown,
        example: UserStatus.Available,
      },
      lastSeen: {
        type: 'string',
        format: 'date-time',
        example: '2022-02-16T00:00:00Z',
        readOnly: true,
      },
    },
  },
}

export const UserUpdateSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  UserUpdate: {
    type: 'object',
    required: [],
    properties: {
      profilePicture: {
        description: 'Profile picture file to upload',
        type: 'string',
        format: 'binary',
      },
      userData: {
        allOf: [{ $ref: '#/components/schemas/User' }],
        description: 'Update data in JSON format',
      },
      otp: {
        description:
          'One time password to be used only if adding a new 2FA method',
        type: 'string',
      },
    },
  },
}

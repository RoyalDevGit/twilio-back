import mongoose, { Schema, Document, Types } from 'mongoose'
import mongooseAutopopulate from 'mongoose-autopopulate'
import { DateTime } from 'luxon'
import isEmail from 'validator/lib/isEmail'

import { AverageRatings, AverageRatingsSchema } from 'models/Comment'
import { pick } from 'utils/object/pick'
import { getEnumValues } from 'utils/enum/enumUtils'
import { ModelRef } from 'interfaces/ModelRef'
import { FileTracker } from 'models/FileTracker'
import { PhoneNumber, PhoneNumberSchema } from 'models/PhoneNumber'
import { OAuthProvider } from 'interfaces/OAuth'
import { Category } from 'models/Category'
import { Language } from 'models/Language'
import { getTimeZoneByName } from 'utils/date/getTimeZoneByName'

export enum UserStatus {
  Unavailable = 'unavailable',
  Available = 'available',
  InSession = 'in_session',
  Unknown = 'unknown',
}

export enum UserRole {
  Consumer = 'consumer',
  Expert = 'expert',
}

export enum ColorSchemePreference {
  Light = 'light',
  Dark = 'dark',
  System = 'system',
}

export interface OAuthSettings {
  accessToken: string
  refreshToken: string
  provider: OAuthProvider
}

const OAuthSettingsSchema = new Schema<OAuthSettings>({
  accessToken: { type: String },
  refreshToken: { type: String },
  provider: { type: String, enum: getEnumValues(OAuthProvider) },
})

export interface UserSettings extends Types.Subdocument {
  colorScheme?: ColorSchemePreference
  language?: ModelRef<Language>
  timeZone: string
}

const UserSettingsSchema = new Schema<UserSettings>({
  colorScheme: { type: String, enum: getEnumValues(ColorSchemePreference) },
  language: { type: Schema.Types.ObjectId, ref: 'Language' },
  timeZone: {
    type: String,
    required: true,
    validate: {
      validator: (value: string) => {
        const tz = getTimeZoneByName(value)
        return tz
      },
      message: (props) => `${props.value} is not a valid time zone`,
    },
  },
})

const serializeUserSettings = (settings: UserSettings): UserSettings =>
  pick(settings, 'colorScheme', 'language', 'timeZone') as UserSettings

UserSettingsSchema.methods.toJSON = function (
  this: UserSettings
): Partial<UserSettings> {
  return serializeUserSettings(this)
}

export enum TwoFactorAuthMethod {
  SMS = 'sms',
  Authenticator = 'authenticator',
}

export interface TwoFactorAuthSettings extends Types.Subdocument {
  methods?: TwoFactorAuthMethod[]
  preferred?: TwoFactorAuthMethod
  authenticationSecret?: string
}

const TwoFactorAuthSettingsSchema = new Schema<TwoFactorAuthSettings>(
  {
    methods: {
      type: [{ type: String }],
      enum: getEnumValues(TwoFactorAuthMethod),
    },
    preferred: {
      type: String,
      enum: getEnumValues(TwoFactorAuthMethod),
    },
    authenticationSecret: {
      type: String,
    },
  },
  { autoCreate: false }
)

const serializeTwoFactorAuthSettings = (
  settings: TwoFactorAuthSettings
): TwoFactorAuthSettings =>
  pick(settings, 'methods', 'preferred') as TwoFactorAuthSettings

TwoFactorAuthSettingsSchema.methods.toJSON = function (
  this: TwoFactorAuthSettings
): Partial<TwoFactorAuthSettings> {
  return serializeTwoFactorAuthSettings(this)
}

export const TwoFactorAuthSettingsModel = mongoose.model<TwoFactorAuthSettings>(
  'TwoFactorAuthSettings',
  TwoFactorAuthSettingsSchema
)

export interface User extends Document {
  roles: UserRole[]
  status: UserStatus
  firstName: string
  lastName: string
  emailAddress: string
  emailVerificationStartDate?: Date
  password?: string
  emailVerified: boolean
  profilePicture?: ModelRef<FileTracker> | null
  mobilePhoneNumber?: PhoneNumber
  location?: string
  createdBy?: ModelRef<User>
  joined: Date
  settings: UserSettings
  averageRatings?: AverageRatings
  areasOfInterest?: ModelRef<Category>[]
  stripeId?: string
  twoFactorAuthSettings?: TwoFactorAuthSettings
  createdAt: Date
  updatedAt: Date
  oAuthSettings?: OAuthSettings
  chimeAppInstanceUserArn?: string
  lastSeen: Date
  isGuest: boolean
}

const UserSchema = new Schema<User>(
  {
    roles: {
      type: [{ type: String, enum: getEnumValues(UserRole) }],
      required: true,
      default: [UserRole.Consumer],
    },
    firstName: { type: String, trim: true, required: true },
    lastName: { type: String, trim: true, required: true },
    emailAddress: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      validate: (value: string) => {
        if (!value) {
          return true
        }
        return isEmail(value)
      },
    },
    emailVerificationStartDate: {
      type: Date,
      default: (): Date => DateTime.utc().toJSDate(),
    },
    emailVerified: { type: Boolean, required: true, default: false },
    password: { type: String },
    profilePicture: {
      type: Schema.Types.ObjectId,
      ref: 'FileTracker',
      autopopulate: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    joined: {
      type: Date,
      required: true,
      immutable: true,
      default: (): Date => DateTime.utc().toJSDate(),
    },
    settings: { type: UserSettingsSchema },
    oAuthSettings: { type: OAuthSettingsSchema },
    mobilePhoneNumber: {
      type: PhoneNumberSchema,
    },
    location: {
      type: String,
      trim: true,
    },
    averageRatings: {
      type: AverageRatingsSchema,
    },
    areasOfInterest: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    stripeId: { type: String, trim: true },
    twoFactorAuthSettings: { type: TwoFactorAuthSettingsSchema },
    status: {
      type: String,
      enum: getEnumValues(UserStatus),
      required: true,
      default: UserStatus.Unknown,
    },
    chimeAppInstanceUserArn: { type: String, trim: true },
    lastSeen: { type: Date },
    isGuest: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

const serializeUser = (user: User): User =>
  pick(
    user,
    'id',
    'roles',
    'firstName',
    'lastName',
    'emailAddress',
    'emailVerificationStartDate',
    'emailVerified',
    'profilePicture',
    'createdBy',
    'joined',
    'settings',
    'mobilePhoneNumber',
    'location',
    'averageRatings',
    'areasOfInterest',
    'twoFactorAuthSettings',
    'createdAt',
    'updatedAt',
    'status',
    'chimeAppInstanceUserArn',
    'lastSeen',
    'isGuest'
  ) as User

UserSchema.methods.toJSON = function (this: User): Partial<User> {
  return serializeUser(this)
}

UserSchema.plugin(mongooseAutopopulate)

export const UserModel = mongoose.model<User>('User', UserSchema)

import mongoose, { Types, Schema, Document, PaginateModel } from 'mongoose'
import mongooseAutopopulate from 'mongoose-autopopulate'
import mongoosePaginate from 'mongoose-paginate-v2'
import { DateTime } from 'luxon'

import { pick } from 'utils/object/pick'
import { ModelRef } from 'interfaces/ModelRef'
import { FileTracker } from 'models/FileTracker'
import { User } from 'models/User'
import { getEnumValues } from 'utils/enum/enumUtils'
import { Video } from 'models/Video'
import { AverageRatings, AverageRatingsSchema } from 'models/Comment'
import { PhoneNumber, PhoneNumberSchema } from 'models/PhoneNumber'
import { Category } from 'models/Category'
import { Language } from 'models/Language'

export const DEFAULT_EXPERT_NOTICE_PERIOD_IN_MINUTES = 1440

export enum ExpertIntroWizardStatus {
  NotStarted = 'not_started',
  Completed = 'completed',
  Started = 'started',
  Dismissed = 'dismissed',
}

export interface SocialMediaLinks extends Types.Subdocument {
  twitter?: string
  facebook?: string
  linkedIn?: string
  youTube?: string
  instagram?: string
}

const SocialMediaLinksSchema = new Schema<SocialMediaLinks>({
  twitter: { type: String, trim: true },
  facebook: { type: String, trim: true },
  linkedIn: { type: String, trim: true },
  youTube: { type: String, trim: true },
  instagram: { type: String, trim: true },
})

const serializeSocialMediaLinks = (
  socialMediaLinks: SocialMediaLinks
): SocialMediaLinks =>
  pick(
    socialMediaLinks,
    'twitter',
    'facebook',
    'linkedIn',
    'youTube',
    'instagram'
  ) as SocialMediaLinks

SocialMediaLinksSchema.methods.toJSON = function (
  this: SocialMediaLinks
): Partial<SocialMediaLinks> {
  return serializeSocialMediaLinks(this)
}

export interface Expert extends Document {
  user: User
  mainAreaOfExpertise?: string
  description?: Map<string, string>
  phoneNumber?: PhoneNumber
  expertiseCategories?: ModelRef<Category>[]
  location?: string
  languages?: ModelRef<Language>[]
  bannerImage?: ModelRef<FileTracker>
  expertSince: Date
  verified: boolean
  followerCount: number
  followingCount: number
  hourlyRate?: number
  noticePeriod: number
  introVideo?: ModelRef<Video>
  tags?: string[]
  experiences?: string[]
  educations?: string[]
  totalFavorites: number
  isFavorite: boolean
  socialMediaLinks?: SocialMediaLinks
  introWizardStatus?: ExpertIntroWizardStatus
  averageRatings?: AverageRatings
  updatedAt: Date
  createdAt: Date
}

const ExpertSchema = new Schema<Expert>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      unique: true,
      autopopulate: true,
    },
    phoneNumber: { type: PhoneNumberSchema },
    description: {
      type: Map,
    },
    mainAreaOfExpertise: { type: String, trim: true },
    verified: { type: Boolean, default: false },
    followerCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    hourlyRate: { type: Number },
    noticePeriod: {
      type: Number,
      default: DEFAULT_EXPERT_NOTICE_PERIOD_IN_MINUTES,
    },
    location: { type: String, trim: true },
    expertiseCategories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    experiences: [{ type: String, trim: true }],
    educations: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true }],
    languages: [{ type: Schema.Types.ObjectId, ref: 'Language' }],
    bannerImage: {
      type: Schema.Types.ObjectId,
      ref: 'FileTracker',
      autopopulate: true,
    },
    expertSince: {
      type: Date,
      required: true,
      default: (): Date => DateTime.utc().toJSDate(),
    },
    totalFavorites: { type: Number, default: 0, min: 0 },
    introVideo: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
    },
    socialMediaLinks: { type: SocialMediaLinksSchema },
    introWizardStatus: {
      type: String,
      enum: getEnumValues(ExpertIntroWizardStatus),
      required: true,
      default: ExpertIntroWizardStatus.NotStarted,
    },
    averageRatings: {
      type: AverageRatingsSchema,
    },
  },
  { timestamps: true }
)

const serializeExpert = (expert: Expert): Expert =>
  pick(
    expert,
    'id',
    'mainAreaOfExpertise',
    'description',
    'phoneNumber',
    'verified',
    'followerCount',
    'followingCount',
    'hourlyRate',
    'noticePeriod',
    'expertiseCategories',
    'tags',
    'experiences',
    'educations',
    'location',
    'languages',
    'bannerImage',
    'expertSince',
    'user',
    'introVideo',
    'totalFavorites',
    'isFavorite',
    'socialMediaLinks',
    'introWizardStatus',
    'averageRatings',
    'createdAt',
    'updatedAt'
  ) as Expert

ExpertSchema.methods.toJSON = function (this: Expert): Partial<Expert> {
  return serializeExpert(this)
}

ExpertSchema.plugin(mongooseAutopopulate)
ExpertSchema.plugin(mongoosePaginate)

export const ExpertModel = mongoose.model<Expert, PaginateModel<Expert>>(
  'Expert',
  ExpertSchema
)

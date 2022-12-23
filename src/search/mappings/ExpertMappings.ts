import { Expert } from 'models/Expert'
import { AverageRatingsMappings } from 'search/mappings/AverageRatingsMappings'
import {
  DefaultBooleanField,
  DefaultDateField,
  DefaultFloatField,
  DefaultIntegerField,
  DefaultLongField,
  DefaultTextField,
} from 'search/mappings/common'
import { FileTrackerMappings } from 'search/mappings/FileTrackerMappings'
import { LanguageMappings } from 'search/mappings/LanguageMappings'
import { PhoneNumberMappings } from 'search/mappings/PhoneNumberMappings'
import { UserMappings } from 'search/mappings/UserMappings'
import { VideoMappings } from 'search/mappings/VideoMappings'

export interface IndexedExpert extends Expert {
  hasAvailability: boolean
}

export const SocialMediaLinksMappings = {
  dynamic: true,
  properties: {
    twitter: DefaultTextField,
    facebook: DefaultTextField,
    linkedIn: DefaultTextField,
    youTube: DefaultTextField,
    instagram: DefaultTextField,
  },
}

const categoryProperties = {
  code: DefaultTextField,
  description: DefaultTextField,
  id: DefaultTextField,
  title: DefaultTextField,
  iconImage: DefaultTextField,
  heroImage: DefaultTextField,
  status: DefaultTextField,
}

const ExpertCategoryMappings = {
  dynamic: true,
  properties: {
    ...categoryProperties,
    parentCategory: {
      dynamic: true,
      properties: categoryProperties,
    },
  },
}

export const ExpertMappings = {
  dynamic: true,
  properties: {
    id: DefaultTextField,
    user: UserMappings,
    mainAreaOfExpertise: DefaultTextField,
    description: {
      dynamic: true,
      properties: { en: DefaultTextField },
    },
    phoneNumber: PhoneNumberMappings,
    expertiseCategories: ExpertCategoryMappings,
    location: DefaultTextField,
    languages: LanguageMappings,
    bannerImage: FileTrackerMappings,
    expertSince: DefaultDateField,
    verified: DefaultBooleanField,
    followerCount: DefaultLongField,
    followingCount: DefaultLongField,
    hourlyRate: DefaultFloatField,
    noticePeriod: DefaultIntegerField,
    introVideo: VideoMappings,
    tags: DefaultTextField,
    experiences: DefaultTextField,
    educations: DefaultTextField,
    totalFavorites: DefaultLongField,
    isFavorite: DefaultBooleanField,
    socialMediaLinks: SocialMediaLinksMappings,
    introWizardStatus: DefaultTextField,
    averageRatings: AverageRatingsMappings,
    updatedAt: DefaultDateField,
    createdAt: DefaultDateField,
    hasAvailability: DefaultBooleanField,
  },
}

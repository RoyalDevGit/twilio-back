import { AverageRatingsMappings } from 'search/mappings/AverageRatingsMappings'
import {
  DefaultBooleanField,
  DefaultDateField,
  DefaultIntegerField,
  DefaultTextField,
} from 'search/mappings/common'
import { FileTrackerMappings } from 'search/mappings/FileTrackerMappings'

export const VideoThumbnailMappings = {
  dynamic: true,
  properties: {
    file: FileTrackerMappings,
    thumbnailType: DefaultTextField,
    createdBy: DefaultTextField,
    uploaded: DefaultDateField,
  },
}

export const VideoMappings = {
  dynamic: true,
  properties: {
    videoType: DefaultTextField,
    file: FileTrackerMappings,
    title: DefaultTextField,
    description: DefaultTextField,
    thumbnails: VideoThumbnailMappings,
    selectedThumbnail: DefaultTextField,
    visibility: DefaultTextField,
    audience: DefaultTextField,
    madeForKids: DefaultBooleanField,
    tags: DefaultTextField,
    language: DefaultTextField,
    status: DefaultTextField,
    expert: DefaultTextField,
    createdBy: DefaultTextField,
    uploaded: DefaultDateField,
    averageRatings: AverageRatingsMappings,
    totalFavorites: DefaultIntegerField,
    isFavorite: DefaultBooleanField,
    containsPaidPromotion: DefaultBooleanField,
  },
}

import mongoose, { PipelineStage, Types } from 'mongoose'

import { QueryRequest } from 'interfaces/Query'
import { Expert, ExpertModel } from 'models/Expert'
import { User, UserModel } from 'models/User'
import { ExpertFavorite, ExpertFavoriteModel } from 'models/ExpertFavorite'
import { FileTracker, FileTrackerModel } from 'models/FileTracker'
import { paginateAggregationPipeline } from 'utils/pagination/paginateAggregationPipeline'
import { Category, CategoryModel } from 'models/Category'
import { Language, LanguageModel } from 'models/Language'
import { applyFiltersToMongoosePipeline } from 'utils/filters/applyFiltersToMongoosePipeline'

export interface QueryExpertFilters {
  verified?: boolean
  onlineNow?: boolean
  categories?: string[]
  languages?: string[]
  rates?: string[]
  ratings?: string[]
}

interface AggregateResult {
  expert: Expert
  user: User
  expertFavorite?: ExpertFavorite
  userProfilePictureFileTracker?: FileTracker
  bannerImageFileTracker?: FileTracker
  expertiseCategories: Category[]
  parentCategories: Category[]
  languages: Language[]
}

const resultMapper = (item: AggregateResult) => {
  const expert = new ExpertModel(item.expert)
  expert.isFavorite = !!item.expertFavorite
  expert.user = new UserModel(item.user)
  if (item.bannerImageFileTracker) {
    expert.bannerImage = new FileTrackerModel(item.bannerImageFileTracker)
  }
  if (item.userProfilePictureFileTracker) {
    expert.user.profilePicture = new FileTrackerModel(
      item.userProfilePictureFileTracker
    )
  }
  expert.languages = item.languages.map((l) => new LanguageModel(l))
  const parentCategories = item.parentCategories.map(
    (c) => new CategoryModel(c)
  )
  expert.expertiseCategories = item.expertiseCategories.map((c) => {
    const category = new CategoryModel(c)
    if (!category.parentCategory) {
      return category
    }
    category.parentCategory = parentCategories.find(
      (pc) =>
        pc.id.toString() ===
        (category.parentCategory as Types.ObjectId).toString()
    )
    return category
  })

  return expert
}

const getExpertQueryPipeline = (filters: QueryExpertFilters) => {
  const expertQueryPipeline: PipelineStage[] = [
    {
      $lookup: {
        localField: 'expert.user',
        from: 'users',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $lookup: {
        localField: 'expert.languages',
        from: 'languages',
        foreignField: '_id',
        as: 'languages',
      },
    },
    {
      $lookup: {
        localField: 'expert.expertiseCategories',
        from: 'categories',
        foreignField: '_id',
        as: 'expertiseCategories',
      },
    },
    {
      $lookup: {
        localField: 'expertiseCategories.parentCategory',
        from: 'categories',
        foreignField: '_id',
        as: 'parentCategories',
      },
    },
    {
      $lookup: {
        localField: 'user.profilePicture',
        from: 'filetrackers',
        foreignField: '_id',
        as: 'userProfilePictureFileTracker',
      },
    },
    {
      $unwind: {
        path: '$userProfilePictureFileTracker',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        localField: 'expert.bannerImage',
        from: 'filetrackers',
        foreignField: '_id',
        as: 'bannerImageFileTracker',
      },
    },
    {
      $unwind: {
        path: '$bannerImageFileTracker',
        preserveNullAndEmptyArrays: true,
      },
    },
  ]

  applyFiltersToMongoosePipeline(expertQueryPipeline, filters)

  return expertQueryPipeline
}

export const queryExperts = async (
  currentUser: User,
  options: QueryRequest,
  filters: Partial<QueryExpertFilters>
) => {
  const queryResponse = await paginateAggregationPipeline<
    Expert,
    AggregateResult
  >({
    model: ExpertModel,
    paginationRequest: options,
    pipeline: [
      {
        $project: {
          _id: 0,
          expert: '$$ROOT',
        },
      },
      ...getExpertQueryPipeline(filters),
    ],
    resultMapper,
  })

  if (currentUser) {
    const expertIds = queryResponse.items.map((e) => e.id)

    const favorites = await ExpertFavoriteModel.find({
      expert: { $in: expertIds },
      user: currentUser.id,
    })

    const favoriteMap = {} as Record<string, true>

    favorites.forEach((f) => {
      favoriteMap[f.expert.toString()] = true
    })

    queryResponse.items.forEach((e) => {
      e.isFavorite = !!favoriteMap[e.id]
    })
  }

  return queryResponse
}

export const queryUserFavoriteExperts = async (
  currentUser: User,
  options: QueryRequest,
  filters: Partial<QueryExpertFilters>
) => {
  const pipeline = [
    {
      $project: {
        _id: 0,
        expertFavorite: '$$ROOT',
      },
    },
    {
      $match: {
        'expertFavorite.user': new mongoose.Types.ObjectId(currentUser.id),
      },
    },
    {
      $lookup: {
        localField: 'expertFavorite.expert',
        from: 'experts',
        foreignField: '_id',
        as: 'expert',
      },
    },
    {
      $unwind: {
        path: '$expert',
        preserveNullAndEmptyArrays: true,
      },
    },
    ...getExpertQueryPipeline(filters),
  ]

  const queryResponse = await paginateAggregationPipeline<
    Expert,
    AggregateResult
  >({
    model: ExpertFavoriteModel,
    paginationRequest: options,
    pipeline,
    resultMapper,
  })

  return queryResponse
}

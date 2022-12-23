import { PipelineStage } from 'mongoose'

import { FileTracker, FileTrackerModel } from 'models/FileTracker'
import { paginateAggregationPipeline } from 'utils/pagination/paginateAggregationPipeline'
import { Category, CategoryModel, CategoryStatus } from 'models/Category'
import { QueryRequest } from 'interfaces/Query'

interface AggregateResult {
  category: Category
  iconImage?: FileTracker
  heroImage?: FileTracker
}

const resultMapper = (item: AggregateResult) => {
  const category = new CategoryModel(item.category)
  if (item.iconImage) {
    category.iconImage = new FileTrackerModel(item.iconImage)
  }
  if (item.heroImage) {
    category.heroImage = new FileTrackerModel(item.heroImage)
  }

  return category
}

export const queryRecommendedCategories = async (options: QueryRequest) => {
  const pipeline: PipelineStage[] = [
    {
      $project: {
        _id: 0.0,
        category: '$$ROOT',
      },
    },
    {
      $match: {
        status: { $ne: CategoryStatus.Inactive },
        'category.parentCategory': {
          $ne: null,
        },
      },
    },
    {
      $lookup: {
        from: 'experts',
        localField: 'category._id',
        foreignField: 'expertiseCategories',
        as: 'experts',
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'category.parentCategory',
        foreignField: '_id',
        as: 'parentCategory',
      },
    },
    {
      $unwind: {
        path: '$parentCategory',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      // has experts associated...
      $match: {
        'experts.1': {
          $exists: true,
        },
      },
    },
    {
      $group: {
        _id: '$parentCategory._id',
      },
    },
    {
      $project: {
        _id: 0.0,
        parentCategoryId: '$$ROOT._id',
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'parentCategoryId',
        foreignField: '_id',
        as: 'category',
      },
    },
    {
      $unwind: {
        path: '$category',
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $match: {
        status: { $ne: CategoryStatus.Inactive },
      },
    },
    {
      $lookup: {
        from: 'filetrackers',
        localField: 'category.iconImage',
        foreignField: '_id',
        as: 'iconImage',
      },
    },
    {
      $unwind: {
        path: '$iconImage',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'filetrackers',
        localField: 'category.heroImage',
        foreignField: '_id',
        as: 'heroImage',
      },
    },
    {
      $unwind: {
        path: '$heroImage',
        preserveNullAndEmptyArrays: true,
      },
    },
    { $sort: { 'category.title': 1 } },
  ]

  const queryResponse = await paginateAggregationPipeline<
    Category,
    AggregateResult
  >({
    model: CategoryModel,
    paginationRequest: options,
    pipeline,
    resultMapper,
  })

  return queryResponse
}

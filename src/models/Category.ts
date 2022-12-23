import mongoose, { Schema, Document, PaginateModel } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

import { ModelRef } from 'interfaces/ModelRef'
import { FileTracker } from 'models/FileTracker'
import { pick } from 'utils/object/pick'
import { getEnumValues } from 'utils/enum/enumUtils'

export enum CategoryStatus {
  Active = 'active',
  Inactive = 'inactive',
}

export interface Category extends Document {
  title: string
  code: string
  description?: string
  parentCategory?: ModelRef<Category>
  iconImage?: ModelRef<FileTracker>
  heroImage?: ModelRef<FileTracker>
  status: CategoryStatus
}

const CategorySchema = new Schema<Category, PaginateModel<Category>>(
  {
    title: { type: String, required: true, trim: true },
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      immutable: true,
    },
    description: { type: String, trim: true },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    iconImage: {
      type: Schema.Types.ObjectId,
      ref: 'FileTracker',
    },
    heroImage: {
      type: Schema.Types.ObjectId,
      ref: 'FileTracker',
    },
    status: {
      type: String,
      trim: true,
      enum: getEnumValues(CategoryStatus),
      default: CategoryStatus.Active,
    },
  },
  { timestamps: true }
)

const serializeCategory = (category: Partial<Category>): Partial<Category> =>
  pick(
    category,
    'id',
    'title',
    'code',
    'description',
    'parentCategory',
    'iconImage',
    'heroImage',
    'status'
  ) as Partial<Category>

CategorySchema.methods.toJSON = function (this: Category): Partial<Category> {
  return serializeCategory(this)
}

CategorySchema.plugin(mongoosePaginate)

export const CategoryModel = mongoose.model<Category, PaginateModel<Category>>(
  'Category',
  CategorySchema
)

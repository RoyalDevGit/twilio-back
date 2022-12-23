import mongoose, { Schema, Document, PaginateModel } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

import { ModelRef } from 'interfaces/ModelRef'
import { FileTracker } from 'models/FileTracker'
import { pick } from 'utils/object/pick'
import { getEnumValues } from 'utils/enum/enumUtils'
import { Category } from 'models/Category'

export enum ArticleStatus {
  Active = 'active',
  Inactive = 'inactive',
}

export interface Article extends Document {
  title: string
  code: string
  body?: string
  category?: ModelRef<Category>
  thumbnail?: ModelRef<FileTracker>
  heroImage?: ModelRef<FileTracker>
  status: ArticleStatus
}

const ArticleSchema = new Schema<Article, PaginateModel<Article>>(
  {
    title: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    body: { type: String, trim: false },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    thumbnail: {
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
      enum: getEnumValues(ArticleStatus),
      default: ArticleStatus.Active,
    },
  },
  { timestamps: true }
)

const serializeArticle = (article: Partial<Article>): Partial<Article> =>
  pick(
    article,
    'id',
    'title',
    'code',
    'body',
    'category',
    'thumbnail',
    'heroImage',
    'status'
  ) as Partial<Article>

ArticleSchema.methods.toJSON = function (this: Article): Partial<Article> {
  return serializeArticle(this)
}

ArticleSchema.plugin(mongoosePaginate)

export const ArticleModel = mongoose.model<Article, PaginateModel<Article>>(
  'Article',
  ArticleSchema
)

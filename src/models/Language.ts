import mongoose, { Schema, Document, PaginateModel } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

import { pick } from 'utils/object/pick'
import { ModelRef } from 'interfaces/ModelRef'
import { FileTracker } from 'models/FileTracker'
import { getEnumValues } from 'utils/enum/enumUtils'

export enum LanguageStatus {
  Active = 'active',
  Inactive = 'inactive',
}

export interface Language extends Document {
  code: string
  name: string
  invertedName: string
  iconImage?: ModelRef<FileTracker>
  status: LanguageStatus
}

const LanguageSchema = new Schema<Language, PaginateModel<Language>>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    invertedName: {
      type: String,
      required: true,
    },
    iconImage: {
      type: Schema.Types.ObjectId,
      ref: 'FileTracker',
    },
    status: {
      type: String,
      trim: true,
      enum: getEnumValues(LanguageStatus),
      default: LanguageStatus.Active,
    },
  },
  { timestamps: true }
)

const serializeLanguage = (language: Partial<Language>): Partial<Language> =>
  pick(
    language,
    'id',
    'code',
    'name',
    'invertedName',
    'iconImage',
    'status'
  ) as Partial<Language>

LanguageSchema.methods.toJSON = function (this: Language): Partial<Language> {
  return serializeLanguage(this)
}

LanguageSchema.plugin(mongoosePaginate)

export const LanguageModel = mongoose.model<Language, PaginateModel<Language>>(
  'Language',
  LanguageSchema
)

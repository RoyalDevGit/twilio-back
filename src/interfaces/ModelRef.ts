import { Document, Types } from 'mongoose'

export type ObjectIdLike = string | Types.ObjectId

export type ModelRef<T extends Document> = T | ObjectIdLike

import { PassThrough, Readable } from 'stream'
import path from 'path'
import fsPromises from 'fs/promises'

import mongoose, { Schema, Document, PaginateModel } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'
import { DateTime } from 'luxon'
import short from 'short-uuid'
import mime from 'mime'
import sharp from 'sharp'

import { User } from 'models/User'
import { ModelRef } from 'interfaces/ModelRef'
import { pick } from 'utils/object/pick'
import { getEnumValues } from 'utils/enum/enumUtils'
import { ExpectedFormFile } from 'utils/http/form/ParsedHttpForm'
import { deleteObject, uploadObject } from 'apis/AwsS3'

export enum FileTrackerStatus {
  Null = 'null',
  Persisting = 'persisting',
  Persisted = 'persisted',
  Inactive = 'inactive',
  Deleting = 'deleting',
  Deleted = 'deleted',
}

export interface FileTracker extends Document {
  originalFileName?: string
  fileKey: string
  extension?: string
  mimeType?: string
  bucket: string
  size?: number
  status: FileTrackerStatus
  createdBy: ModelRef<User>
  updatedAt: Date
  createdAt: Date
  deactivatedAt?: Date
  upload: (
    bucket: string,
    fileStream: Readable | ReadableStream
  ) => Promise<FileTracker>
  uploadImage: (
    bucket: string,
    fileStream: Readable | ReadableStream
  ) => Promise<FileTracker>
  uploadProfilePicture: (
    bucket: string,
    fileStream: Readable | ReadableStream
  ) => Promise<FileTracker>
  deactivate: () => Promise<FileTracker>
  delete: () => Promise<FileTracker>
}

interface IFileTrackerModel extends PaginateModel<FileTracker> {
  fromFormFile(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formFile: ExpectedFormFile<any>,
    fileOptions: Partial<FileTracker>
  ): FileTracker
  fromFileSystem: (
    filePath: string,
    fileOptions: Partial<FileTracker>
  ) => Promise<FileTracker>
}

const FileTrackerSchema = new Schema<FileTracker, IFileTrackerModel>(
  {
    originalFileName: { type: String, trim: true, immutable: true },
    extension: { type: String, required: true, trim: true, immutable: true },
    mimeType: { type: String, trim: true, immutable: true },
    size: { type: Number, immutable: true },
    bucket: { type: String, trim: true, required: true },
    fileKey: { type: String, trim: true, required: true },
    status: {
      type: String,
      trim: true,
      enum: getEnumValues(FileTrackerStatus),
      default: FileTrackerStatus.Null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
    deactivatedAt: {
      type: Date,
    },
  },
  { timestamps: true }
)

FileTrackerSchema.virtual('fileName').get(function (this: FileTracker) {
  return `${this.id}${this.extension}`
})

FileTrackerSchema.pre('validate', function (this: FileTracker) {
  if (this.fileKey && !this.extension) {
    this.extension = path.extname(this.fileKey)
  }

  if (this.extension && !this.mimeType) {
    this.mimeType = mime.lookup(this.extension)
  }
})

FileTrackerSchema.statics.fromFileSystem = async function (
  filePath: string,
  fileOptions: Partial<FileTracker>
): Promise<FileTracker> {
  const fileStats = await fsPromises.stat(filePath)
  const originalFileName = path.basename(filePath)
  const extension = path.extname(filePath)
  const mimeType = mime.lookup(extension)

  const newFile = new FileTrackerModel({
    ...fileOptions,
    originalFileName,
    extension,
    mimeType,
    size: fileStats.size,
  })
  return newFile
}

FileTrackerSchema.statics.fromFormFile = function (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formFile: ExpectedFormFile<any>,
  fileOptions: Partial<FileTracker>
): FileTracker {
  const newFile = new FileTrackerModel({
    ...fileOptions,
    originalFileName: formFile.info?.fileName,
    extension: formFile.info?.extension,
    mimeType: formFile.info?.mimeType,
  })
  return newFile
}

FileTrackerSchema.methods.upload = async function (
  this: FileTracker,
  bucket: string,
  fileStream: Readable
): Promise<FileTracker> {
  this.bucket = bucket
  this.status = FileTrackerStatus.Persisting
  this.fileKey = `f${this.id}-${short.generate()}${this.extension}`
  await this.save()
  let totalBytes = 0
  fileStream.on('data', (chunk) => {
    totalBytes = totalBytes + chunk.length
  })
  await uploadObject(bucket, this.fileKey, fileStream)
  this.status = FileTrackerStatus.Persisted
  this.size = totalBytes
  await this.save()
  return this
}

FileTrackerSchema.methods.uploadImage = async function (
  this: FileTracker,
  bucket: string,
  fileStream: Readable
): Promise<FileTracker> {
  const webpStream = new PassThrough()
  const webpTransformer = sharp().webp()
  fileStream.pipe(webpTransformer).pipe(webpStream)
  this.extension = '.webp'
  this.mimeType = 'image/webp'
  return this.upload(bucket, webpStream)
}

FileTrackerSchema.methods.uploadProfilePicture = async function (
  this: FileTracker,
  bucket: string,
  fileStream: Readable
): Promise<FileTracker> {
  const webpStream = new PassThrough()
  const webpTransformer = sharp().resize(300, 300).webp()
  fileStream.pipe(webpTransformer).pipe(webpStream)
  this.extension = '.webp'
  this.mimeType = 'image/webp'
  return this.upload(bucket, webpStream)
}

FileTrackerSchema.methods.deactivate = async function (
  this: FileTracker
): Promise<FileTracker> {
  this.status = FileTrackerStatus.Inactive
  this.deactivatedAt = DateTime.utc().toJSDate()
  await this.save()
  return this
}

FileTrackerSchema.methods.delete = async function (
  this: FileTracker
): Promise<FileTracker> {
  this.status = FileTrackerStatus.Deleting
  await this.save()
  await deleteObject(this.bucket, this.fileKey)
  this.status = FileTrackerStatus.Deleted
  await this.save()
  return this
}

const serializeFile = (
  fileTracker: Partial<FileTracker>
): Partial<FileTracker> =>
  pick(
    fileTracker,
    'id',
    'fileKey',
    'originalFileName',
    'extension',
    'mimeType',
    'size',
    'status',
    'createdBy',
    'createdAt',
    'updatedAt',
    'deactivatedAt'
  ) as Partial<FileTracker>

FileTrackerSchema.methods.toJSON = function (
  this: FileTracker
): Partial<FileTracker> {
  return serializeFile(this)
}

FileTrackerSchema.plugin(mongoosePaginate)

export const FileTrackerModel = mongoose.model<FileTracker, IFileTrackerModel>(
  'FileTracker',
  FileTrackerSchema
)

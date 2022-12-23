import { Readable } from 'stream'

import S3 from 'aws-sdk/clients/s3'

import { Env } from 'utils/env'

const AWS_REGION = Env.getString('AWS_REGION')
const AWS_ACCESS_KEY_ID = Env.getString('AWS_ACCESS_KEY_ID')
const AWS_SECRET_ACCESS_KEY = Env.getString('AWS_SECRET_ACCESS_KEY')
const AWS_S3_ENDPOINT = Env.getString('AWS_S3_ENDPOINT')
const AWS_S3_FORCE_PATH_STYLE = Env.getBoolean('AWS_S3_FORCE_PATH_STYLE')

const s3Client = new S3({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
  endpoint: AWS_S3_ENDPOINT,
  s3ForcePathStyle: AWS_S3_FORCE_PATH_STYLE,
})

export const uploadObject = (
  bucket: string,
  fileName: string,
  fileStream: Readable
): Promise<S3.ManagedUpload.SendData> => {
  const params: S3.PutObjectRequest = {
    Bucket: bucket,
    Key: fileName,
    Body: fileStream,
    CacheControl: 'max-age=604800',
  }

  return new Promise((resolve, reject) => {
    s3Client.upload(params, (err, data) => {
      if (err) {
        return reject(err)
      }
      resolve(data)
    })
  })
}

export const deleteObject = (
  bucket: string,
  fileName: string
): Promise<S3.DeleteObjectOutput> => {
  const params: S3.DeleteObjectRequest = {
    Bucket: bucket,
    Key: fileName,
  }

  return new Promise((resolve, reject) => {
    s3Client.deleteObject(params, (err, data) => {
      if (err) {
        return reject(err)
      }
      resolve(data)
    })
  })
}

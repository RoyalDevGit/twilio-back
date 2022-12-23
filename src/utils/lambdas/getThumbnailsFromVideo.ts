import { Env } from 'utils/env'
import { invokeLambda } from 'apis/AwsLambda'

const AWS_GENERATE_VIDEO_THUMBNAILS_LAMBDA_ARN = Env.getString(
  'AWS_GENERATE_VIDEO_THUMBNAILS_LAMBDA_ARN'
)

export interface GenerateVideoThumbnailsParams {
  bucket: string
  videoFileKey: string
}

interface GenerateVideoThumbnailsResponse {
  thumbnailsKeys: string[]
}

export const getThumbnailsFromVideo = (req: GenerateVideoThumbnailsParams) =>
  invokeLambda<GenerateVideoThumbnailsResponse>({
    FunctionName: AWS_GENERATE_VIDEO_THUMBNAILS_LAMBDA_ARN,
    Payload: JSON.stringify(req),
  })

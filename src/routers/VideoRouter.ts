import express, { Request, Response, NextFunction } from 'express'
import isJSON from 'validator/lib/isJSON'

import { requireAuthenticationMiddlewares } from 'middleware/authMiddleware'
import { AuthenticatedRequest } from 'interfaces/Express'
import { Video, VideoModel, VideoThumbnailType } from 'models/Video'
import { ApiError, ApiErrorCode, ValidationError } from 'utils/error/ApiError'
import { Env } from 'utils/env'
import {
  ExpectedFormField,
  ExpectedFormFile,
  ParsedHttpForm,
} from 'utils/http/form/ParsedHttpForm'
import { FileTracker, FileTrackerModel } from 'models/FileTracker'
import { VideoFavoriteModel } from 'models/VideoFavorite'
import { parseQueryStringFromRequest } from 'utils/http/parseQueryStringFromRequest'
import { parsePaginationParams } from 'utils/pagination/parsePaginationParams'

const AWS_S3_VIDEO_ASSETS_BUCKET = Env.getString('AWS_S3_VIDEO_ASSETS_BUCKET')

export const videoRouterPathPrefix = '/videos'
export const VideoRouter = express.Router()
interface GetVideoParams {
  videoId: string
}

const populateVideo = async (
  req: AuthenticatedRequest,
  video: Video | null | undefined
) => {
  if (!video) {
    return null
  }
  const { user } = req
  const favorite = await VideoFavoriteModel.findOne({
    expert: video.id,
    user: user.id,
  })
  video.isFavorite = !!favorite
  return video
}

VideoRouter.get('/:videoId', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { params } = appReq
    const { videoId } = params as unknown as GetVideoParams

    try {
      const video = await VideoModel.findById(videoId).populate(
        'thumbnails.file'
      )
      if (!video) {
        throw new ApiError('videoNotFound', ApiErrorCode.NotFound)
      }
      const populatedVideo = await populateVideo(appReq, video)
      res.status(200).json(populatedVideo)
    } catch (e) {
      next(e)
    }
  },
])

enum VideoUpdateFormFiles {
  thumbnailFile = 'thumbnailFile',
}

enum VideoUpdateFormFields {
  videoData = 'videoData',
  VideoUpdateFormFields = 'VideoUpdateFormFields',
}

VideoRouter.patch('/:videoId', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, params } = appReq
    const { videoId } = params as unknown as GetVideoParams
    try {
      const video = await VideoModel.findById(videoId).populate(
        'thumbnails.file'
      )
      if (!video) {
        throw new ApiError('videoNotFound', ApiErrorCode.NotFound)
      }

      const thumbnailFile = new ExpectedFormFile<FileTracker>({
        formName: VideoUpdateFormFiles.thumbnailFile,
        expectedMimeType: 'image/*',
        onUpload: (stream, formFile) => {
          const file = FileTrackerModel.fromFormFile(formFile, {
            createdBy: user.id,
          })
          file.createdBy = user.id
          return file.uploadImage(AWS_S3_VIDEO_ASSETS_BUCKET, stream)
        },
      })

      const videoData = new ExpectedFormField({
        formName: VideoUpdateFormFields.videoData,
        validate: (value) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          if (!isJSON(value as string, { allow_primitives: false })) {
            throw new ValidationError('videoUpdateJsonIsNotValid', {
              path: VideoUpdateFormFields.videoData,
              type: 'pattern',
              value,
            })
          }
        },
      })

      const { validationErrors } = await ParsedHttpForm.fromRequest(req, {
        expectedFiles: [thumbnailFile],
        expectedFields: [videoData],
      })

      if (validationErrors.length) {
        throw new ApiError(
          'videoUpdateFormIsNotValid',
          ApiErrorCode.BadRequest,
          { validationErrors: validationErrors }
        )
      }

      if (thumbnailFile.hasUploadPromise()) {
        const file = await thumbnailFile.getUploadPromise()
        const customThumbnail = video.thumbnails.create({
          thumbnailType: VideoThumbnailType.Custom,
          file: file,
          createdBy: user.id,
        })

        video.thumbnails
          .filter((t) => t.thumbnailType === VideoThumbnailType.Custom)
          .forEach((t) => {
            const underlyingFile = t.file as FileTracker
            video.thumbnails.remove(t.id)
            underlyingFile.deactivate()
          })

        video.thumbnails.push(customThumbnail)
        video.selectedThumbnail = customThumbnail.id
      }

      if (video.isModified()) {
        await video.save()
      }

      if (videoData.value) {
        const updateData = JSON.parse(
          videoData.value as string
        ) as Partial<Video>
        delete updateData.file
        delete updateData.thumbnails
        await VideoModel.findByIdAndUpdate(video.id, updateData)
      }

      const updatedVideo = await VideoModel.findById(videoId).populate(
        'thumbnails.file'
      )

      const populatedVideo = await populateVideo(appReq, updatedVideo)
      res.status(200).json(populatedVideo)
    } catch (e) {
      next(e)
    }
  },
])

VideoRouter.delete('/:videoId', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { params } = appReq
    const { videoId } = params as unknown as GetVideoParams

    try {
      const video = await VideoModel.findById(videoId)
      if (!video) {
        throw new ApiError('videoNotFound', ApiErrorCode.NotFound)
      }

      await video.delete()

      res.sendStatus(204)
    } catch (e) {
      next(e)
    }
  },
])

VideoRouter.patch('/:videoId/favorite', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, params } = appReq
    const { videoId } = params as unknown as GetVideoParams

    try {
      const video = await VideoModel.findById(videoId)
      if (!video) {
        throw new ApiError('videoNotFound', ApiErrorCode.NotFound)
      }
      let videoFavorite = await VideoFavoriteModel.findOne({
        video: video.id,
        user: user.id,
      })

      if (videoFavorite) {
        throw new ApiError('videoAlreadyFavorited', ApiErrorCode.AlreadyExists)
      }

      videoFavorite = new VideoFavoriteModel({
        video: video.id,
        user: user.id,
        createdBy: user.id,
      })
      await videoFavorite.save()
      const updatedVideo = (await VideoModel.findByIdAndUpdate(
        video.id,
        {
          $inc: { totalFavorites: 1 },
        },
        { new: true, runValidators: true }
      )) as Video

      updatedVideo.isFavorite = true
      res.status(200).json(updatedVideo)
    } catch (e) {
      next(e)
    }
  },
])

VideoRouter.patch('/:videoId/unfavorite', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, params } = appReq
    const { videoId } = params as unknown as GetVideoParams

    try {
      const video = await VideoModel.findById(videoId)
      if (!video) {
        throw new ApiError('videoNotFound', ApiErrorCode.NotFound)
      }
      const videoFavorite = await VideoFavoriteModel.findOne({
        video: video.id,
        user: user.id,
      })

      if (!videoFavorite) {
        throw new ApiError('videoFavoriteNotFound', ApiErrorCode.NotFound)
      }

      await videoFavorite.delete()

      const updatedVideo = (await VideoModel.findByIdAndUpdate(
        video.id,
        {
          $inc: { totalFavorites: -1 },
        },
        { new: true, runValidators: true }
      )) as Video

      updatedVideo.isFavorite = false
      res.status(200).json(updatedVideo)
    } catch (e) {
      next(e)
    }
  },
])

interface QueryVideosSearchParams {
  expertId: string
  favorites: boolean
}

VideoRouter.get('/', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, query } = appReq
    const paginationRequest = parsePaginationParams(query)
    const { expertId, favorites } =
      parseQueryStringFromRequest<QueryVideosSearchParams>(appReq)

    try {
      if (favorites) {
        const queryResponse = await VideoModel.queryUserFavorites(user.id, {
          ...paginationRequest,
          expertId,
        })

        res.status(200).json(queryResponse)
      } else {
        const queryResponse = await VideoModel.query({
          ...paginationRequest,
          expertId,
        })
        res.status(200).json(queryResponse)
      }
    } catch (e) {
      next(e)
    }
  },
])

import express, { Request, Response, NextFunction } from 'express'
import { DateTime, Interval } from 'luxon'
import isJSON from 'validator/lib/isJSON'
import isEmpty from 'lodash/isEmpty'

import { Expert, ExpertModel } from 'models/Expert'
import { requireAuthenticationMiddlewares } from 'middleware/authMiddleware'
import { AuthenticatedRequest } from 'interfaces/Express'
import { EventModel, Event, Weekday } from 'models/Event'
import { getRecurringEventInstances } from 'repositories/event/getRecurringEventInstances'
import { Video, VideoModel, VideoThumbnailType } from 'models/Video'
import { ApiError, ApiErrorCode, ValidationError } from 'utils/error/ApiError'
import { Env } from 'utils/env'
import {
  ExpectedFormField,
  ExpectedFormFile,
  ParsedHttpForm,
} from 'utils/http/form/ParsedHttpForm'
import { FileTrackerModel, FileTracker } from 'models/FileTracker'
import { getThumbnailsFromVideo } from 'utils/lambdas/getThumbnailsFromVideo'
import { UserModel, UserRole } from 'models/User'
import { SessionAttendeeModel } from 'models/Session'
import { ExpertFavoriteModel } from 'models/ExpertFavorite'
import { parseQueryStringFromRequest } from 'utils/http/parseQueryStringFromRequest'
import {
  AvailabilityOption,
  AvailabilityOptionModel,
} from 'models/AvailabilityOption'
import {
  SessionDurationOption,
  SessionDurationOptionModel,
} from 'models/SessionDurationOption'
import { BlockoutDate, BlockoutDateModel } from 'models/BlockoutDate'
import { parsePaginationParams } from 'utils/pagination/parsePaginationParams'
import { getExpertAvailability } from 'repositories/expert/getExpertAvailability'
import {
  expertSearch,
  reindexExperts,
  updateExpertIndex,
} from 'search/expertIndex'
import {
  queryExperts,
  queryUserFavoriteExperts,
} from 'repositories/expert/queryExperts'
import { getEnumValues } from 'utils/enum/enumUtils'
import { getExpertInstantAvailability } from 'repositories/expert/getExpertInstantAvailability'
import { ExpertInstantAvailability } from 'interfaces/ExpertAvailability'
import {
  expertPopulationPaths,
  populateExpertFavorite,
} from 'repositories/expert/populateExpert'
import { getExpertFiltersFromReq } from 'utils/filters/getExpertFiltersFromReq'
import { queueExpertFavoriteNotification } from 'notifications/ExpertFavorite'
import { attachUserMiddleware } from 'middleware/attachUserMiddleware'

const AWS_S3_VIDEO_ASSETS_BUCKET = Env.getString('AWS_S3_VIDEO_ASSETS_BUCKET')
const AWS_S3_STORAGE_BUCKET = Env.getString('AWS_S3_STORAGE_BUCKET')

export const expertRouterPathPrefix = '/experts'
export const ExpertRouter = express.Router()

const ES_DRUPAL_KEY = Env.getString('ES_DRUPAL_KEY')

ExpertRouter.post('/reindex', [
  ...requireAuthenticationMiddlewares({
    allowBearerToken: false,
    apiKey: ES_DRUPAL_KEY,
  }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await reindexExperts()
      res.sendStatus(204)
    } catch (e) {
      next(e)
    }
  },
])

interface CreateExpertParams {
  userId: string
}

interface SearchExpertsQueryParams {
  query: string
}

ExpertRouter.get('/recommended', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, query } = appReq
    const paginationRequest = parsePaginationParams(query)
    const expertFilters = getExpertFiltersFromReq(req)

    try {
      const queryResponse = await queryExperts(
        user,
        {
          ...paginationRequest,
        },
        expertFilters
      )
      res.status(200).json(queryResponse)
    } catch (e) {
      next(e)
    }
  },
])

ExpertRouter.get('/favorites', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, query } = appReq
    const paginationRequest = parsePaginationParams(query)
    const expertFilters = getExpertFiltersFromReq(req)

    try {
      const queryResponse = await queryUserFavoriteExperts(
        user,
        {
          ...paginationRequest,
        },
        expertFilters
      )

      res.status(200).json(queryResponse)
    } catch (e) {
      next(e)
    }
  },
])

ExpertRouter.get('/featured', [
  ...attachUserMiddleware(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, query } = appReq
    const paginationRequest = parsePaginationParams(query)
    const expertFilters = getExpertFiltersFromReq(req)

    try {
      const queryResponse = await queryExperts(
        user,
        {
          ...paginationRequest,
        },
        expertFilters
      )
      res.status(200).json(queryResponse)
    } catch (e) {
      next(e)
    }
  },
])

ExpertRouter.get('/search', [
  // ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { query } =
      parseQueryStringFromRequest<SearchExpertsQueryParams>(appReq)
    const expertFilters = getExpertFiltersFromReq(req)

    try {
      const result = await expertSearch(query || '', expertFilters)
      res.status(200).json(result)
    } catch (e) {
      next(e)
    }
  },
])

ExpertRouter.get('/me', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user } = appReq
    try {
      const expert = await ExpertModel.findOne({ user: user.id }).populate(
        expertPopulationPaths
      )
      if (!expert) {
        throw new ApiError('expertNotFound', ApiErrorCode.NotFound)
      }
      const populatedExpert = await populateExpertFavorite(expert, user)
      res.status(200).json(populatedExpert)
    } catch (e) {
      next(e)
    }
  },
])

ExpertRouter.post('/:userId', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, params } = appReq
    const { userId } = params as unknown as CreateExpertParams
    try {
      const existingUser = await UserModel.findById(userId)
      if (!existingUser) {
        throw new ApiError('userNotFound', ApiErrorCode.NotFound)
      }

      const existingExpert = await ExpertModel.findOne({ user: userId })
      if (existingExpert) {
        throw new ApiError('userIsAlreadyExpert', ApiErrorCode.AlreadyExists)
      }

      const bannerImage = new ExpectedFormFile<FileTracker>({
        formName: 'bannerImage',
        expectedMimeType: 'image/*',
        onUpload: (stream, formFile) => {
          const file = FileTrackerModel.fromFormFile(formFile, {
            createdBy: user.id,
          })
          file.createdBy = user.id
          return file.uploadImage(AWS_S3_STORAGE_BUCKET, stream)
        },
      })

      const expertDataField = new ExpectedFormField({
        formName: 'expertData',
        validate: (value) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          if (!isJSON(value as string, { allow_primitives: false })) {
            throw new ValidationError('updateJsonIsNotValid', {
              path: 'expertData',
              type: 'pattern',
              value,
            })
          }
        },
      })

      const { validationErrors } = await ParsedHttpForm.fromRequest(req, {
        expectedFiles: [bannerImage],
        expectedFields: [expertDataField],
      })

      if (validationErrors.length) {
        throw new ApiError('updateFormIsNotValid', ApiErrorCode.BadRequest, {
          validationErrors: validationErrors,
        })
      }

      let expertData: Partial<Expert> = {}
      if (expertDataField.value) {
        expertData = JSON.parse(
          expertDataField.value as string
        ) as Partial<Expert>
      }

      const newBannerImage = await bannerImage?.getUploadPromise()
      if (newBannerImage) {
        expertData.bannerImage = newBannerImage
      }

      const newExpert = new ExpertModel({
        ...expertData,
        user: existingUser,
      })
      await newExpert.save()
      await newExpert.populate(expertPopulationPaths)

      if (!existingUser.roles.includes(UserRole.Expert)) {
        existingUser.roles.push(UserRole.Expert)
      }
      await existingUser.save()

      const populatedExpert = await populateExpertFavorite(
        newExpert as Expert,
        user
      )

      res.status(201).json(populatedExpert)

      updateExpertIndex(populatedExpert.id)
    } catch (e) {
      next(e)
    }
  },
])

interface GetExpertParams {
  expertId: string
}

ExpertRouter.patch('/:expertId', [
  ...requireAuthenticationMiddlewares({
    apiKey: ES_DRUPAL_KEY,
  }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, params } = appReq
    const { expertId } = params as unknown as GetExpertParams

    try {
      const expert = await ExpertModel.findById(expertId)
      if (!expert) {
        throw new ApiError('expertNotFound', ApiErrorCode.NotFound)
      }

      const bannerImage = new ExpectedFormFile<FileTracker>({
        formName: 'bannerImage',
        expectedMimeType: 'image/*',
        onUpload: (stream, formFile) => {
          const file = FileTrackerModel.fromFormFile(formFile, {
            createdBy: user.id,
          })
          file.createdBy = user.id
          return file.uploadImage(AWS_S3_STORAGE_BUCKET, stream)
        },
      })

      const expertDataField = new ExpectedFormField({
        formName: 'expertData',
        validate: (value) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          if (!isJSON(value as string, { allow_primitives: false })) {
            throw new ValidationError('updateJsonIsNotValid', {
              path: 'expertData',
              type: 'pattern',
              value,
            })
          }
        },
      })

      const { validationErrors } = await ParsedHttpForm.fromRequest(req, {
        expectedFiles: [bannerImage],
        expectedFields: [expertDataField],
      })

      if (validationErrors.length) {
        throw new ApiError('updateFormIsNotValid', ApiErrorCode.BadRequest, {
          validationErrors: validationErrors,
        })
      }

      let expertData: Partial<Expert> = {}
      if (expertDataField.value) {
        expertData = JSON.parse(
          expertDataField.value as string
        ) as Partial<Expert>
      }

      const newBannerImage = await bannerImage?.getUploadPromise()
      if (newBannerImage) {
        expertData.bannerImage = newBannerImage
      }

      if (isEmpty(expertData)) {
        res
          .status(400)
          .json(new ApiError('noExpertData', ApiErrorCode.BadRequest))
        return
      }

      if (expertData.socialMediaLinks) {
        expertData.socialMediaLinks = Object.assign(
          {},
          expert.socialMediaLinks?.toJSON() || {},
          expertData.socialMediaLinks
        )
      }

      const updatedExpert = await ExpertModel.findByIdAndUpdate(
        expert._id,
        expertData,
        {
          new: true,
          runValidators: true,
        }
      ).populate(expertPopulationPaths)

      const populatedExpert = await populateExpertFavorite(
        updatedExpert as Expert,
        user
      )

      res.status(200).json(populatedExpert)

      updateExpertIndex(populatedExpert.id)
    } catch (e) {
      next(e)
    }
  },
])

ExpertRouter.get('/:expertId', [
  ...attachUserMiddleware(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, params } = appReq
    const { expertId } = params as unknown as GetExpertParams

    try {
      const expert = await ExpertModel.findById(expertId).populate(
        expertPopulationPaths
      )
      if (!expert) {
        throw new ApiError('expertNotFound', ApiErrorCode.NotFound)
      }

      const populatedExpert = await populateExpertFavorite(expert, user)
      res.status(200).json(populatedExpert)
    } catch (e) {
      next(e)
    }
  },
])

ExpertRouter.patch('/:expertId/favorite', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, params } = appReq
    const { expertId } = params as unknown as GetExpertParams

    try {
      const expert = await ExpertModel.findById(expertId)
      if (!expert) {
        throw new ApiError('expertNotFound', ApiErrorCode.NotFound)
      }
      let expertFavorite = await ExpertFavoriteModel.findOne({
        expert: expert.id,
        user: user.id,
      })

      if (expertFavorite) {
        throw new ApiError('expertAlreadyFavorited', ApiErrorCode.AlreadyExists)
      }

      expertFavorite = new ExpertFavoriteModel({
        expert: expert.id,
        user: user.id,
        createdBy: user.id,
      })
      await expertFavorite.save()

      if (user.isGuest) {
        expert.isFavorite = true
        res.status(200).json(expert)
        return
      }

      const updatedExpert = (await ExpertModel.findByIdAndUpdate(
        expert.id,
        {
          $inc: { totalFavorites: 1 },
        },
        { new: true, runValidators: true }
      ).populate(expertPopulationPaths)) as Expert

      const populatedExpert = await populateExpertFavorite(
        updatedExpert as Expert,
        user
      )
      updateExpertIndex(populatedExpert.id)

      queueExpertFavoriteNotification({
        currentUser: user,
        expert: updatedExpert,
        consumer: user,
      })

      updatedExpert.isFavorite = true
      res.status(200).json(updatedExpert)
    } catch (e) {
      next(e)
    }
  },
])

ExpertRouter.patch('/:expertId/unfavorite', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, params } = appReq
    const { expertId } = params as unknown as GetExpertParams

    try {
      const expert = await ExpertModel.findById(expertId)
      if (!expert) {
        throw new ApiError('expertNotFound', ApiErrorCode.NotFound)
      }
      const expertFavorite = await ExpertFavoriteModel.findOne({
        expert: expert.id,
        user: user.id,
      })

      if (!expertFavorite) {
        throw new ApiError('expertFavoriteNotFound', ApiErrorCode.NotFound)
      }

      await expertFavorite.delete()

      if (user.isGuest) {
        expert.isFavorite = false
        res.status(200).json(expert)
        return
      }

      const updatedExpert = (await ExpertModel.findByIdAndUpdate(
        expert.id,
        {
          $inc: { totalFavorites: -1 },
        },
        { new: true, runValidators: true }
      )) as Expert

      updateExpertIndex(updatedExpert.id)

      updatedExpert.isFavorite = false
      res.status(200).json(updatedExpert)
    } catch (e) {
      next(e)
    }
  },
])

ExpertRouter.get('/', [
  ...attachUserMiddleware(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, query } = appReq
    const paginationRequest = parsePaginationParams(query)
    const expertFilters = getExpertFiltersFromReq(req)
    try {
      const queryResponse = await queryExperts(
        user,
        {
          ...paginationRequest,
        },
        expertFilters
      )
      res.status(200).json(queryResponse)
    } catch (e) {
      next(e)
    }
  },
])

interface CreateEventParams {
  expertId: string
}

ExpertRouter.post('/:expertId/events', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, body, params } = appReq
    const { expertId } = params as unknown as CreateEventParams
    const newEventData = body as Event

    try {
      const expert = await ExpertModel.findById(expertId)
      if (!expert) {
        throw new ApiError('expertNotFound', ApiErrorCode.NotFound)
      }

      const newEvent = new EventModel(newEventData)
      newEvent.expert = expert._id
      newEvent.createdBy = user._id
      newEvent.originalStartDate = newEvent.startDate
      await newEvent.save()
      res.status(201).json(newEvent)
    } catch (e) {
      next(e)
    }
  },
])

interface QueryEventsPathParams {
  expertId: string
}

interface QueryEventsQueryParams {
  from: string
  to: string
}

ExpertRouter.get('/:expertId/events', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { query, params } = appReq
    const { expertId } = params as unknown as QueryEventsPathParams
    const queryParams = query as unknown as QueryEventsQueryParams

    const fromDate = DateTime.fromISO(queryParams.from)
    const toDate = DateTime.fromISO(queryParams.to)
    try {
      const expert = await ExpertModel.findById(expertId)
      if (!expert) {
        throw new ApiError('expertNotFound', ApiErrorCode.NotFound)
      }

      const events = await EventModel.find({
        expert: expert._id,
        $or: [
          {
            recursion: null,
            'startDate.date': { $gte: fromDate },
            'endDate.date': { $lte: toDate },
          },
          {
            recursion: { $ne: null },
            $or: [
              { 'recursion.endDate': null },
              { 'recursion.endDate': { $lte: toDate } },
            ],
          },
        ],
      })

      const allEvents: Partial<Event>[] = []
      events.forEach((event) => {
        if (!event.recursion) {
          allEvents.push(event)
          return
        }
        const recursionEvents = getRecurringEventInstances(event, {
          from: fromDate,
          to: toDate,
        })
        allEvents.push(...recursionEvents)
      })

      res.status(200).json(allEvents)
    } catch (e) {
      next(e)
    }
  },
])

interface UploadVideoPathParams {
  expertId: string
}

enum VideoUploadFormFiles {
  videoFile = 'videoFile',
  thumbnailFile = 'thumbnailFile',
}

enum VideoUploadFormFields {
  videoData = 'videoData',
}

ExpertRouter.post('/:expertId/videos', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, params } = appReq
    const { expertId } = params as unknown as UploadVideoPathParams
    try {
      const expert = await ExpertModel.findById(expertId)
      if (!expert) {
        throw new ApiError('expertNotFound', ApiErrorCode.NotFound)
      }

      const videoFile = new ExpectedFormFile<FileTracker>({
        required: true,
        formName: VideoUploadFormFiles.videoFile,
        expectedMimeType: 'video/*',
        onUpload: async (stream, formFile) => {
          const videoFileTracker = FileTrackerModel.fromFormFile(formFile, {
            createdBy: user.id,
          })

          await videoFileTracker.upload(AWS_S3_VIDEO_ASSETS_BUCKET, stream)
          return videoFileTracker
        },
      })

      const thumbnailFile = new ExpectedFormFile<FileTracker>({
        required: false,
        formName: VideoUploadFormFiles.thumbnailFile,
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
        required: false,
        formName: VideoUploadFormFields.videoData,
        validate: (value) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          if (!isJSON(value as string, { allow_primitives: false })) {
            throw new ValidationError('videoUploadJsonIsNotValid', {
              path: VideoUploadFormFields.videoData,
              type: 'pattern',
              value,
            })
          }
        },
      })

      const { validationErrors } = await ParsedHttpForm.fromRequest(req, {
        expectedFiles: [videoFile, thumbnailFile],
        expectedFields: [videoData],
      })

      if (validationErrors.length) {
        throw new ApiError(
          'videoUploadFormIsNotValid',
          ApiErrorCode.BadRequest,
          { validationErrors: validationErrors }
        )
      }

      let videoProps: Partial<Video> = {}
      if (videoData.value) {
        videoProps = JSON.parse(videoData.value as string) as Video
      }

      const newVideo = new VideoModel({
        ...videoProps,
        expert: expertId,
        createdBy: user.id,
      })

      const videoFileTracker = await videoFile.getUploadPromise()

      newVideo.file = videoFileTracker

      const { thumbnailsKeys } = await getThumbnailsFromVideo({
        bucket: AWS_S3_VIDEO_ASSETS_BUCKET,
        videoFileKey: videoFileTracker.fileKey,
      })

      const thumbnailPromises = thumbnailsKeys.map(async (fileKey) => {
        const file = new FileTrackerModel({
          fileKey,
          bucket: AWS_S3_VIDEO_ASSETS_BUCKET,
          createdBy: user.id,
        })
        await file.save()
        const thumbnailDoc = newVideo.thumbnails.create({
          thumbnailType: VideoThumbnailType.AutoGenerated,
          file,
          createdBy: user.id,
        })
        newVideo.thumbnails.push(thumbnailDoc)
      })

      await Promise.all(thumbnailPromises)

      if (thumbnailFile.hasUploadPromise()) {
        const thumbnailFileTracker = await thumbnailFile.getUploadPromise()
        const customThumbnail = newVideo.thumbnails.create({
          thumbnailType: VideoThumbnailType.Custom,
          file: thumbnailFileTracker,
          createdBy: user.id,
        })
        newVideo.thumbnails.push(customThumbnail)
        newVideo.selectedThumbnail = customThumbnail.id
      }

      await newVideo.save()

      res.status(201).json(newVideo)
    } catch (e) {
      next(e)
    }
  },
])

ExpertRouter.get('/:expertId/review-eligibility', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, params } = appReq
    const { expertId } = params as unknown as GetExpertParams

    try {
      const expert = await ExpertModel.findById(expertId).populate('user')
      if (!expert) {
        throw new ApiError('expertNotFound', ApiErrorCode.NotFound)
      }

      if (expert.user.id === user.id) {
        res.status(200).json(false)
        return
      }

      const currentUserSessions = await SessionAttendeeModel.find(
        { user: user.id },
        'session'
      )

      const userSessionIds = currentUserSessions.map((s) => s.session)

      const expertUserSessions = await SessionAttendeeModel.find(
        { session: { $in: userSessionIds }, user: expert.user.id },
        '_id'
      )

      res.status(200).json(expertUserSessions.length > 0)
    } catch (e) {
      next(e)
    }
  },
])

ExpertRouter.post('/:expertId/availability-options', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { params, body } = appReq
    const { expertId } = params as unknown as GetExpertParams
    const availabilityData = body as AvailabilityOption
    try {
      const expert = await ExpertModel.findById(expertId)
      if (!expert) {
        throw new ApiError('expertNotFound', ApiErrorCode.NotFound)
      }

      const existingAvailability = await AvailabilityOptionModel.findOne({
        expert: expert.id,
        weekday: availabilityData.weekday,
      })
      if (existingAvailability) {
        throw new ApiError(
          'availabilityOptionAlreadyExists',
          ApiErrorCode.AlreadyExists
        )
      }

      const newAvailability = new AvailabilityOptionModel({
        ...availabilityData,
        expert: expert.id,
      })

      await newAvailability.save()

      res.status(201).json(newAvailability)

      updateExpertIndex(expert.id)
    } catch (e) {
      next(e)
    }
  },
])

interface ApplyToAllBody {
  sourceWeekday: Weekday
}

ExpertRouter.post('/:expertId/availability-options/apply-to-all', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { params, body } = appReq
    const { expertId } = params as unknown as GetExpertParams
    const applyToAllSettings = body as ApplyToAllBody
    try {
      const expert = await ExpertModel.findById(expertId)
      if (!expert) {
        throw new ApiError('expertNotFound', ApiErrorCode.NotFound)
      }

      const sourceOption = await AvailabilityOptionModel.findOne({
        expert: expert.id,
        weekday: applyToAllSettings.sourceWeekday,
      })
      if (!sourceOption) {
        throw new ApiError('availabilityOptionNotFound', ApiErrorCode.NotFound)
      }

      // delete other options
      await AvailabilityOptionModel.deleteMany({
        expert: expert.id,
        weekday: { $ne: applyToAllSettings.sourceWeekday },
      })

      const copiedOptions: AvailabilityOption[] = []
      getEnumValues(Weekday).forEach((weekday) => {
        if (weekday === applyToAllSettings.sourceWeekday) {
          return
        }
        copiedOptions.push(
          new AvailabilityOptionModel({
            expert: expert.id,
            enabled: sourceOption.enabled,
            weekday,
            ranges: sourceOption.ranges,
          })
        )
      })

      await AvailabilityOptionModel.insertMany(copiedOptions)

      res.status(201).json([sourceOption, ...copiedOptions])

      updateExpertIndex(expert.id)
    } catch (e) {
      next(e)
    }
  },
])

interface AvailabilityUpdateParams extends GetExpertParams {
  availabilityId: string
}

ExpertRouter.patch('/:expertId/availability-options/:availabilityId', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { params, body } = appReq
    const { expertId, availabilityId } =
      params as unknown as AvailabilityUpdateParams
    const availabilityData = body as AvailabilityOption
    try {
      const expert = await ExpertModel.findById(expertId)
      if (!expert) {
        throw new ApiError('expertNotFound', ApiErrorCode.NotFound)
      }

      const existingAvailability = await AvailabilityOptionModel.findById(
        availabilityId
      )
      if (!existingAvailability) {
        throw new ApiError('availabilityOptionNotFound', ApiErrorCode.NotFound)
      }

      const updatedAvailability =
        await AvailabilityOptionModel.findByIdAndUpdate(
          availabilityId,
          availabilityData,
          { new: true, runValidators: true }
        )

      res.status(200).json(updatedAvailability)

      updateExpertIndex(expert.id)
    } catch (e) {
      next(e)
    }
  },
])

ExpertRouter.get('/:expertId/availability-options', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { params } = appReq
    const { expertId } = params as unknown as GetExpertParams
    try {
      const expert = await ExpertModel.findById(expertId)
      if (!expert) {
        throw new ApiError('expertNotFound', ApiErrorCode.NotFound)
      }

      const existingAvailabilities = await AvailabilityOptionModel.find({
        expert: expert.id,
      })

      res.status(200).json(existingAvailabilities)
    } catch (e) {
      next(e)
    }
  },
])

ExpertRouter.post('/:expertId/session-duration-options', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { params, body } = appReq
    const { expertId } = params as unknown as GetExpertParams
    const durationData = body as SessionDurationOption
    try {
      const expert = await ExpertModel.findById(expertId)
      if (!expert) {
        throw new ApiError('expertNotFound', ApiErrorCode.NotFound)
      }

      const existingDuration = await SessionDurationOptionModel.findOne({
        expert: expert.id,
        duration: durationData.duration,
      })
      if (existingDuration) {
        throw new ApiError(
          'sessionDurationOptionAlreadyExists',
          ApiErrorCode.AlreadyExists
        )
      }

      const newDuration = new SessionDurationOptionModel({
        ...durationData,
        expert: expert.id,
      })

      await newDuration.save()

      res.status(201).json(newDuration)

      updateExpertIndex(expert.id)
    } catch (e) {
      next(e)
    }
  },
])

interface DurationUpdateParams extends GetExpertParams {
  sessionDurationId: string
}

ExpertRouter.patch('/:expertId/session-duration-options/:sessionDurationId', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { params, body } = appReq
    const { expertId, sessionDurationId } =
      params as unknown as DurationUpdateParams
    const durationData = body as SessionDurationOption
    try {
      const expert = await ExpertModel.findById(expertId)
      if (!expert) {
        throw new ApiError('expertNotFound', ApiErrorCode.NotFound)
      }

      const existingDuration = await SessionDurationOptionModel.findById(
        sessionDurationId
      )
      if (!existingDuration) {
        throw new ApiError(
          'sessionDurationOptionNotFound',
          ApiErrorCode.NotFound
        )
      }

      const updatedDuration =
        await SessionDurationOptionModel.findByIdAndUpdate(
          sessionDurationId,
          durationData,
          { new: true, runValidators: true }
        )

      res.status(200).json(updatedDuration)

      updateExpertIndex(expert.id)
    } catch (e) {
      next(e)
    }
  },
])

ExpertRouter.delete('/:expertId/session-duration-options/:sessionDurationId', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { params } = appReq
    const { expertId, sessionDurationId } =
      params as unknown as DurationUpdateParams
    try {
      const expert = await ExpertModel.findById(expertId)
      if (!expert) {
        throw new ApiError('expertNotFound', ApiErrorCode.NotFound)
      }

      const existingDuration = await SessionDurationOptionModel.findById(
        sessionDurationId
      )
      if (!existingDuration) {
        throw new ApiError(
          'sessionDurationOptionNotFound',
          ApiErrorCode.NotFound
        )
      }

      await existingDuration.delete()

      res.sendStatus(204)

      updateExpertIndex(expert.id)
    } catch (e) {
      next(e)
    }
  },
])

ExpertRouter.get('/:expertId/session-duration-options', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { params } = appReq
    const { expertId } = params as unknown as GetExpertParams
    try {
      const expert = await ExpertModel.findById(expertId)
      if (!expert) {
        throw new ApiError('expertNotFound', ApiErrorCode.NotFound)
      }

      const existingDurations = await SessionDurationOptionModel.find({
        expert: expert.id,
      })

      res.status(200).json(existingDurations)
    } catch (e) {
      next(e)
    }
  },
])

ExpertRouter.post('/:expertId/blockout-dates', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { params, body } = appReq
    const { expertId } = params as unknown as GetExpertParams
    const updateData = body as BlockoutDate
    try {
      const expert = await ExpertModel.findById(expertId)
      if (!expert) {
        throw new ApiError('expertNotFound', ApiErrorCode.NotFound)
      }

      const existingBlockoutDate = await BlockoutDateModel.findOne({
        expert: expert.id,
        date: updateData.date,
      })
      if (existingBlockoutDate) {
        throw new ApiError(
          'blockoutDateAlreadyExists',
          ApiErrorCode.AlreadyExists
        )
      }

      const newBlockoutDate = new BlockoutDateModel({
        ...updateData,
        expert: expert.id,
      })

      await newBlockoutDate.save()

      res.status(201).json(newBlockoutDate)
    } catch (e) {
      next(e)
    }
  },
])

interface BlockoutDateUpdateParams extends GetExpertParams {
  blockoutDateId: string
}

ExpertRouter.delete('/:expertId/blockout-dates/:blockoutDateId', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { params } = appReq
    const { expertId, blockoutDateId } =
      params as unknown as BlockoutDateUpdateParams
    try {
      const expert = await ExpertModel.findById(expertId)
      if (!expert) {
        throw new ApiError('expertNotFound', ApiErrorCode.NotFound)
      }

      const existingBlockoutDate = await BlockoutDateModel.findById(
        blockoutDateId
      )
      if (!existingBlockoutDate) {
        throw new ApiError('blockoutDateNotFound', ApiErrorCode.NotFound)
      }

      await existingBlockoutDate.delete()

      res.sendStatus(204)
    } catch (e) {
      next(e)
    }
  },
])

ExpertRouter.get('/:expertId/blockout-dates', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { params } = appReq
    const { expertId } = params as unknown as GetExpertParams
    try {
      const expert = await ExpertModel.findById(expertId)
      if (!expert) {
        throw new ApiError('expertNotFound', ApiErrorCode.NotFound)
      }

      const existingBlockoutDates = await BlockoutDateModel.find({
        expert: expert.id,
        date: {
          $gte: DateTime.now().startOf('day').toUTC().toJSDate(),
        },
      })

      res.status(200).json(existingBlockoutDates)
    } catch (e) {
      next(e)
    }
  },
])

interface AvailabilityQueryParams extends GetExpertParams {
  from: string
  to: string
  selectedDate?: string
  selectedDuration?: number
}

ExpertRouter.get('/:expertId/availability', [
  ...attachUserMiddleware(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, params } = appReq
    const { expertId } = params as unknown as GetExpertParams

    const { from, to, selectedDate, selectedDuration } =
      parseQueryStringFromRequest<AvailabilityQueryParams>(appReq)

    try {
      if (!from || !to) {
        throw new ApiError('invalidDateRange', ApiErrorCode.BadRequest)
      }

      const expert = await ExpertModel.findById(expertId)
      if (!expert) {
        throw new ApiError('expertNotFound', ApiErrorCode.NotFound)
      }

      const fromDate = DateTime.fromISO(from).toUTC()
      const toDate = DateTime.fromISO(to).toUTC()
      const dateInterval = Interval.fromDateTimes(fromDate, toDate)

      if (!dateInterval.isValid) {
        throw new ApiError('invalidDateRange', ApiErrorCode.BadRequest)
      }

      const availability = await getExpertAvailability(expert, user, {
        from: fromDate,
        to: toDate,
        selectedDate: selectedDate
          ? DateTime.fromISO(selectedDate).toUTC()
          : undefined,
        selectedDuration,
      })
      res.status(200).json(availability)
    } catch (e) {
      next(e)
    }
  },
])

interface InstantAvailabilityQueryParams {
  ignoreActiveSession?: boolean
}

ExpertRouter.get('/:expertId/availability/instant', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { params } = appReq
    const { expertId } = params as unknown as GetExpertParams

    const { ignoreActiveSession } =
      parseQueryStringFromRequest<InstantAvailabilityQueryParams>(appReq)

    try {
      const expert = await ExpertModel.findById(expertId)
      if (!expert) {
        throw new ApiError('expertNotFound', ApiErrorCode.NotFound)
      }

      const durations = await getExpertInstantAvailability(
        expert,
        DateTime.now(),
        {
          ignoreActiveSession,
        }
      )

      const availability: ExpertInstantAvailability = {
        durations,
      }

      res.status(200).json(availability)
    } catch (e) {
      next(e)
    }
  },
])

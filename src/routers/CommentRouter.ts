/* eslint-disable no-case-declarations */
import express, { Request, Response, NextFunction } from 'express'
import { Types } from 'mongoose'

import { requireAuthenticationMiddlewares } from 'middleware/authMiddleware'
import { AuthenticatedRequest } from 'interfaces/Express'
import {
  Comment,
  CommentEntityType,
  CommentModel,
  CommentType,
} from 'models/Comment'
import { QueryRequest } from 'interfaces/Query'
import { ApiError, ApiErrorCode } from 'utils/error/ApiError'
import { Video, VideoModel } from 'models/Video'
import {
  CommentLikeStatusModel,
  CommentLikeStatusValue,
} from 'models/CommentLikeStatus'
import { User, UserModel } from 'models/User'
import { parseQueryStringFromRequest } from 'utils/http/parseQueryStringFromRequest'
import { Session, SessionModel } from 'models/Session'
import { Expert, ExpertModel } from 'models/Expert'
import { calculateExpertRatings } from 'repositories/expert/calculateExpertRatings'
import { calculateConsumerRatings } from 'repositories/user/calculateConsumerRatings'
import { commentPopulationPaths } from 'repositories/comment/populateComment'
import { queryComments } from 'repositories/comment/queryComments'
import { queueCommentNotification } from 'notifications/comments'
import { attachUserMiddleware } from 'middleware/attachUserMiddleware'

export const commentRouterPathPrefix = '/comments'
export const CommentRouter = express.Router()

interface CommentEntityInfo {
  entityId: string
  entity: Video | Comment | Session | User | Expert
  isEntityOwner: boolean
}

const validateAndGetCommentEntityInfo = async (
  appReq: AuthenticatedRequest,
  entityType: CommentEntityType | undefined,
  entityId: string | undefined
): Promise<CommentEntityInfo> => {
  const { user: currentUser } = appReq

  const commentEntityInfo: Partial<CommentEntityInfo> = {
    entityId,
    isEntityOwner: false,
  }

  if (!entityType) {
    throw new ApiError(
      'missingCommentEntityType',
      ApiErrorCode.ValidationFailed
    )
  }
  if (!entityId) {
    throw new ApiError('missingCommentEntityId', ApiErrorCode.ValidationFailed)
  }
  switch (entityType) {
    case CommentEntityType.Comment:
      const comment = await CommentModel.findById(entityId)
      if (!comment) {
        throw new ApiError('commentNotFound', ApiErrorCode.NotFound)
      }
      commentEntityInfo.entity = comment
      if (typeof comment.createdBy === 'string') {
        commentEntityInfo.isEntityOwner = comment.createdBy === currentUser.id
      } else {
        commentEntityInfo.isEntityOwner =
          comment.createdBy._id.toString() === currentUser.id
      }
      break
    case CommentEntityType.Video:
      const video = await VideoModel.findById(entityId)
      if (!video) {
        throw new ApiError('videoNotFound', ApiErrorCode.NotFound)
      }
      commentEntityInfo.entity = video
      if (typeof video.createdBy === 'string') {
        commentEntityInfo.isEntityOwner = video.createdBy === currentUser.id
      } else {
        commentEntityInfo.isEntityOwner =
          video.createdBy._id.toString() === currentUser.id
      }
      break
    case CommentEntityType.Session:
      const session = await SessionModel.findById(entityId)
      if (!session) {
        throw new ApiError('sessionNotFound', ApiErrorCode.NotFound)
      }
      commentEntityInfo.entity = session
      if (typeof session.createdBy === 'string') {
        commentEntityInfo.isEntityOwner = session.createdBy === currentUser.id
      } else {
        commentEntityInfo.isEntityOwner =
          session.createdBy.id === currentUser.id
      }
      break
    case CommentEntityType.Expert:
      const expert = await ExpertModel.findById(entityId).populate('user')
      if (!expert) {
        throw new ApiError('expertNotFound', ApiErrorCode.NotFound)
      }
      commentEntityInfo.entity = expert
      commentEntityInfo.isEntityOwner = expert.user.id === currentUser.id
      break
    case CommentEntityType.Consumer:
      const commentUser = await UserModel.findById(entityId)
      if (!commentUser) {
        throw new ApiError('userNotFound', ApiErrorCode.NotFound)
      }
      commentEntityInfo.entity = commentUser
      commentEntityInfo.isEntityOwner = commentUser.id === currentUser.id
      break
    default:
      throw new ApiError(
        'invalidCommentEntityType',
        ApiErrorCode.ValidationFailed
      )
  }

  return commentEntityInfo as CommentEntityInfo
}

const recalculateEntityRatings = async (
  appReq: AuthenticatedRequest,
  entityType: CommentEntityType,
  entityInfo: CommentEntityInfo
): Promise<void> => {
  const { user } = appReq

  switch (entityType) {
    case CommentEntityType.Video:
      break
    case CommentEntityType.Expert:
      const expert = entityInfo.entity as Expert
      await calculateExpertRatings(expert)
      break
    case CommentEntityType.Consumer:
      const consumer = entityInfo.entity as User
      await calculateConsumerRatings(consumer)
      break
    case CommentEntityType.Session:
      const session = entityInfo.entity as Session
      const userExpertProfile = await ExpertModel.findOne({
        user: user.id,
      }).populate('user')
      const sessionConsumerObjetId = session.consumer as Types.ObjectId
      const sessionExpertObjectId = session.expert as Types.ObjectId
      const isConsumer = user.id === sessionConsumerObjetId.toString()
      const isExpert =
        userExpertProfile &&
        userExpertProfile.id === sessionExpertObjectId.toString()
      userExpertProfile && userExpertProfile.id === sessionExpertObjectId.id

      if (isConsumer) {
        const sessionExpert = await ExpertModel.findById(
          sessionExpertObjectId
        ).populate('user')
        if (sessionExpert) {
          await calculateExpertRatings(sessionExpert)
        }
      } else if (isExpert) {
        const sessionConsumer = await UserModel.findById(sessionConsumerObjetId)
        if (sessionConsumer) {
          await calculateConsumerRatings(sessionConsumer)
        }
      }
      break
  }
}

CommentRouter.post('/', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, body } = appReq
    const newCommentData = body as Partial<Comment> | undefined

    try {
      if (!newCommentData) {
        throw new ApiError('noCommentDataProvided', ApiErrorCode.BadRequest)
      }

      const entityInfo = await validateAndGetCommentEntityInfo(
        appReq,
        newCommentData.entityType,
        newCommentData.entityId?.toString()
      )
      if (!entityInfo.isEntityOwner && newCommentData.pinned) {
        throw new ApiError(
          'onlyEntityOwnersCanPinComments',
          ApiErrorCode.Forbidden
        )
      }

      const newComment = new CommentModel(newCommentData)
      newComment.createdBy = user._id

      switch (newComment.entityType) {
        case CommentEntityType.Session:
          const session = entityInfo.entity as Session
          const userExpertProfile = await ExpertModel.findOne({ user: user.id })
          const sessionConsumer = session.consumer as Types.ObjectId
          const sessionExpert = session.expert as Types.ObjectId
          const isConsumer = user.id === sessionConsumer.toString()
          const isExpert =
            userExpertProfile &&
            userExpertProfile.id === sessionExpert.toString()
          if (!isConsumer && !isExpert) {
            throw new ApiError(
              'onlySessionPartiesCanRateIt',
              ApiErrorCode.Forbidden
            )
          }
          break
      }

      await newComment.save()

      if (newComment.entityType === CommentEntityType.Comment) {
        await CommentModel.findByIdAndUpdate(newComment.entityId, {
          $inc: { totalReplies: 1 },
        })
      }

      await newComment.populate(commentPopulationPaths)

      if (newComment.commentType === CommentType.Review) {
        await recalculateEntityRatings(
          appReq,
          newCommentData.entityType as CommentEntityType,
          entityInfo
        )
      }

      queueCommentNotification({ currentUser: user, comment: newComment })

      res.status(201).json(newComment)
    } catch (e) {
      next(e)
    }
  },
])

interface UpdateCommentParams {
  commentId: string
}

CommentRouter.delete('/:commentId', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, params } = appReq
    const { commentId } = params as unknown as UpdateCommentParams

    try {
      const comment = await CommentModel.findById(commentId)
      if (!comment) {
        throw new ApiError('commentNotFound', ApiErrorCode.NotFound)
      }

      const owner = comment.createdBy as User
      if (owner.id !== user.id) {
        throw new ApiError(
          'onlyCreatorCanDeleteComment',
          ApiErrorCode.Forbidden
        )
      }

      await comment.delete()

      await CommentModel.deleteMany({
        entityType: CommentEntityType.Comment,
        entityId: comment._id,
      })

      await CommentLikeStatusModel.deleteMany({
        comment: comment._id,
      })

      if (comment.entityType === CommentEntityType.Comment) {
        await CommentModel.findByIdAndUpdate(comment.entityId, {
          $inc: { totalReplies: -1 },
        })
      }

      res.sendStatus(204)
    } catch (e) {
      next(e)
    }
  },
])

CommentRouter.patch('/:commentId', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { params, body } = appReq
    const { commentId } = params as unknown as UpdateCommentParams
    const updateData = body as Partial<Comment> | undefined

    try {
      if (!updateData) {
        throw new ApiError('noCommentDataProvided', ApiErrorCode.BadRequest)
      }

      const comment = await CommentModel.findById(commentId)
      if (!comment) {
        throw new ApiError('commentNotFound', ApiErrorCode.NotFound)
      }

      const entityInfo = await validateAndGetCommentEntityInfo(
        appReq,
        comment.entityType,
        comment.entityId.toString()
      )

      if (updateData.pinned && !entityInfo.isEntityOwner) {
        throw new ApiError(
          'onlyEntityOwnersCanPinComments',
          ApiErrorCode.Forbidden
        )
      }

      delete updateData.totalReplies
      delete updateData.likeCount
      delete updateData.dislikeCount

      const updatedComment = await CommentModel.findByIdAndUpdate(
        commentId,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      ).populate(commentPopulationPaths)

      if (comment.commentType === CommentType.Review) {
        await recalculateEntityRatings(appReq, comment.entityType, entityInfo)
      }

      res.status(200).json(updatedComment)
    } catch (e) {
      next(e)
    }
  },
])

CommentRouter.patch('/:commentId/like', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, params } = appReq
    const { commentId } = params as unknown as UpdateCommentParams

    try {
      const comment = await CommentModel.findById(commentId)
      if (!comment) {
        throw new ApiError('commentNotFound', ApiErrorCode.NotFound)
      }
      let commentLikeStatus = await CommentLikeStatusModel.findOne({
        comment: comment.id,
        user: user.id,
      })

      let updatedComment: Comment | null = null
      if (commentLikeStatus) {
        if (commentLikeStatus.value === CommentLikeStatusValue.Liked) {
          throw new ApiError('commentAlreadyLiked', ApiErrorCode.AlreadyExists)
        }
        commentLikeStatus.value = CommentLikeStatusValue.Liked
        await commentLikeStatus.save()
        updatedComment = await CommentModel.findByIdAndUpdate(
          comment.id,
          {
            $inc: { likeCount: 1, dislikeCount: -1 },
          },
          {
            new: true,
            runValidators: true,
          }
        ).populate(commentPopulationPaths)
      } else {
        commentLikeStatus = new CommentLikeStatusModel({
          comment: comment.id,
          user: user.id,
          value: CommentLikeStatusValue.Liked,
          createdBy: user.id,
        })
        await commentLikeStatus.save()
        updatedComment = await CommentModel.findByIdAndUpdate(
          comment.id,
          {
            $inc: { likeCount: 1 },
          },
          {
            new: true,
            runValidators: true,
          }
        ).populate(commentPopulationPaths)
      }

      if (!updatedComment) {
        throw new ApiError('commentNotFound', ApiErrorCode.NotFound)
      }

      updatedComment.likeStatus = CommentLikeStatusValue.Liked
      res.status(200).json(updatedComment)
    } catch (e) {
      next(e)
    }
  },
])

CommentRouter.patch('/:commentId/dislike', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, params } = appReq
    const { commentId } = params as unknown as UpdateCommentParams

    try {
      const comment = await CommentModel.findById(commentId)
      if (!comment) {
        throw new ApiError('commentNotFound', ApiErrorCode.NotFound)
      }
      let commentLikeStatus = await CommentLikeStatusModel.findOne({
        comment: comment.id,
        user: user.id,
      })

      let updatedComment: Comment | null = null
      if (commentLikeStatus) {
        if (commentLikeStatus.value === CommentLikeStatusValue.Disliked) {
          throw new ApiError(
            'commentAlreadyDisliked',
            ApiErrorCode.AlreadyExists
          )
        }
        commentLikeStatus.value = CommentLikeStatusValue.Disliked
        await commentLikeStatus.save()
        updatedComment = await CommentModel.findByIdAndUpdate(
          comment.id,
          {
            $inc: { likeCount: -1, dislikeCount: 1 },
          },
          {
            new: true,
            runValidators: true,
          }
        ).populate(commentPopulationPaths)
      } else {
        commentLikeStatus = new CommentLikeStatusModel({
          comment: comment.id,
          user: user.id,
          value: CommentLikeStatusValue.Disliked,
          createdBy: user.id,
        })
        await commentLikeStatus.save()
        updatedComment = await CommentModel.findByIdAndUpdate(
          comment.id,
          {
            $inc: { dislikeCount: 1 },
          },
          {
            new: true,
            runValidators: true,
          }
        ).populate(commentPopulationPaths)
      }

      if (!updatedComment) {
        throw new ApiError('commentNotFound', ApiErrorCode.NotFound)
      }

      updatedComment.likeStatus = CommentLikeStatusValue.Disliked
      res.status(200).json(updatedComment)
    } catch (e) {
      next(e)
    }
  },
])

CommentRouter.patch('/:commentId/clear-like', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, params } = appReq
    const { commentId } = params as unknown as UpdateCommentParams

    try {
      const comment = await CommentModel.findById(commentId)
      if (!comment) {
        throw new ApiError('commentNotFound', ApiErrorCode.NotFound)
      }
      const commentLikeStatus = await CommentLikeStatusModel.findOne({
        comment: comment.id,
        user: user.id,
      })

      if (!commentLikeStatus) {
        throw new ApiError('commentLikeStatusNotFound', ApiErrorCode.NotFound)
      }

      await commentLikeStatus.delete()

      let updatedComment: Comment | null = null
      if (commentLikeStatus.value === CommentLikeStatusValue.Liked) {
        updatedComment = await CommentModel.findByIdAndUpdate(
          comment.id,
          {
            $inc: { likeCount: -1 },
          },
          {
            new: true,
            runValidators: true,
          }
        ).populate(commentPopulationPaths)
      } else {
        updatedComment = await CommentModel.findByIdAndUpdate(
          comment.id,
          {
            $inc: { dislikeCount: -1 },
          },
          {
            new: true,
            runValidators: true,
          }
        ).populate(commentPopulationPaths)
      }

      if (!updatedComment) {
        throw new ApiError('commentNotFound', ApiErrorCode.NotFound)
      }

      res.status(200).json(updatedComment)
    } catch (e) {
      next(e)
    }
  },
])

interface QueryCommentsQueryParams extends QueryRequest {
  commentType: CommentType
  entityType: CommentEntityType
  entityId: string
  createdBy?: string
}

CommentRouter.get('/', [
  ...attachUserMiddleware(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user } = appReq
    const {
      commentType,
      entityType,
      entityId,
      createdBy,
      page,
      limit,
      sort,
      sortDirection,
    } = parseQueryStringFromRequest<QueryCommentsQueryParams>(appReq)

    if (!commentType) {
      throw new ApiError('missingCommentType', ApiErrorCode.ValidationFailed)
    }
    if (!entityType) {
      throw new ApiError(
        'missingCommentEntityType',
        ApiErrorCode.ValidationFailed
      )
    }
    if (!entityId) {
      throw new ApiError(
        'missingCommentEntityId',
        ApiErrorCode.ValidationFailed
      )
    }

    try {
      const queryResponse = await queryComments({
        commentType,
        entityType,
        entityId,
        createdBy,
        page,
        limit,
        sort,
        sortDirection,
        currentUser: user,
      })

      res.status(200).json(queryResponse)
    } catch (e) {
      next(e)
    }
  },
])

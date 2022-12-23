import { FilterQuery } from 'mongoose'

import {
  CommentEntityType,
  CommentModel,
  CommentType,
  Comment,
} from 'models/Comment'
import { CommentLikeStatusModel } from 'models/CommentLikeStatus'
import { toQueryResponse } from 'utils/pagination/toQueryResponse'
import { QueryRequest, QueryResponse } from 'interfaces/Query'
import { User } from 'models/User'
import { queryExpertReviews } from 'repositories/comment/queryExpertReviews'
import { commentPopulationPaths } from 'repositories/comment/populateComment'
import { toMongooseSortDirection } from 'utils/mongoose/toMongooseSortDirection'

export interface QueryCommentsOptions extends QueryRequest {
  commentType: CommentType
  entityType: CommentEntityType
  entityId: string
  currentUser: User
  createdBy?: string
}

export const queryComments = async ({
  page,
  limit,
  sort = 'createdAt',
  sortDirection = 'desc',
  commentType,
  entityType,
  entityId,
  currentUser,
  createdBy,
}: QueryCommentsOptions) => {
  let queryResponse: QueryResponse<Comment>
  if (
    commentType === CommentType.Review &&
    entityType === CommentEntityType.Expert
  ) {
    queryResponse = await queryExpertReviews({
      expertId: entityId,
      page,
      limit,
      sort,
      sortDirection,
      createdBy,
    })
  } else {
    const query: FilterQuery<Comment> = { commentType, entityType, entityId }
    if (createdBy) {
      query.createdBy = createdBy
    }
    const paginationResponse = await CommentModel.paginate(query, {
      pagination: true,
      page,
      limit,
      populate: commentPopulationPaths,
      sort: { [sort]: toMongooseSortDirection(sortDirection) },
    })
    queryResponse = toQueryResponse(paginationResponse)
  }

  const commentIds = queryResponse.items.map((c) => c.id)

  if (currentUser) {
    const commentLikeStatuses = await CommentLikeStatusModel.find({
      comment: { $in: commentIds },
      createdBy: currentUser.id,
    })

    commentLikeStatuses.forEach((likeStatus) => {
      const likeStatusComment = likeStatus.comment as unknown as Comment
      const comment = queryResponse.items.find(
        (c) => c.id === likeStatusComment._id.toString()
      )
      if (comment) {
        comment.likeStatus = likeStatus.value
      }
    })
  }

  return queryResponse
}

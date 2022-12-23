import { DateTime } from 'luxon'

import { Comment, CommentEntityType } from 'models/Comment'
import { User } from 'models/User'
import { createUserDateTime } from 'utils/date/createUserDateTime'

export interface QueueCommentNotification {
  currentUser: User
  comment: Comment
}

export interface CommentNotificationBasePayload {
  commendId: string
  commentyEntityType: CommentEntityType
  commentEntityId: string
  commentContent?: string
  viewCommentUrl?: string
  commentDate: string
  commentTime: string
}

export const getCommentPayloadProps = (
  comment: Comment,
  targetUser: User
): CommentNotificationBasePayload => {
  const commentDate = createUserDateTime(comment.createdAt, targetUser)
  return {
    commendId: comment.id,
    commentyEntityType: comment.entityType,
    commentEntityId: comment.entityId as string,
    commentContent: comment.content,
    commentDate: commentDate.toLocaleString(DateTime.DATE_MED),
    commentTime: commentDate.toLocaleString(DateTime.TIME_SIMPLE),
  }
}

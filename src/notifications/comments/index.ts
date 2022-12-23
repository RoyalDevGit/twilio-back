import { CommentEntityType } from 'models/Comment'
import { queueCommentOnCommentNotification } from 'notifications/comments/CommentOnComment'
import {
  queueSessionCommentNotification,
  queueExpertCommentNotification,
} from 'notifications/comments/CommentOrRating'
import { QueueCommentNotification } from 'notifications/comments/common'

export const queueCommentNotification = async ({
  currentUser,
  comment,
}: QueueCommentNotification) => {
  switch (comment.entityType) {
    case CommentEntityType.Session:
      return queueSessionCommentNotification({ comment, currentUser })
    case CommentEntityType.Expert:
      return queueExpertCommentNotification({ comment, currentUser })
    case CommentEntityType.Comment:
      return queueCommentOnCommentNotification({ comment, currentUser })
  }
}

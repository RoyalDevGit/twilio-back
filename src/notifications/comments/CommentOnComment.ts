import { DateTime } from 'luxon'

import { CommentEntityType, CommentModel } from 'models/Comment'
import { Expert } from 'models/Expert'
import {
  NotificationChannel,
  NotificationContentFormat,
  NotificationType,
  NotificationConfig,
  NotificationAudience,
} from 'models/NotificationConfig'
import { User } from 'models/User'
import { commentPopulationPaths } from 'repositories/comment/populateComment'
import { getSessionById } from 'repositories/session/getSessionById'
import { Env } from 'utils/env'
import { getUserAvatarUrl } from 'utils/url/getUserAvatarUrl'
import { urlJoinWithQuery } from 'utils/url/urlJoinWithQuery'
import {
  CommentNotificationBasePayload,
  getCommentPayloadProps,
  QueueCommentNotification,
} from 'notifications/comments/common'
import { queueNotification } from 'utils/notifications/queueNotification'
import { createUserDateTime } from 'utils/date/createUserDateTime'

const APP_URL = Env.getString('APP_URL')
interface CommentOnCommentPayload extends CommentNotificationBasePayload {
  originalCommentFirstName: string
  originalCommenterProfileImageUrl: string
  originalCommenterFullName: string
  originalComment: string
  originalCommentDate: string
  originalCommentTime: string
  replierFullName: string
  replierFirstName: string
  replierComment: string
  replierCommentDate: string
  replierCommentTime: string
  replierProfileImageUrl: string
}

const EMAIL_COMMENT_ON_COMMENT_TEMPLATE_ID = Env.getString(
  'EMAIL_COMMENT_ON_COMMENT_TEMPLATE_ID'
)

export const CommentOnCommentConfig = new NotificationConfig({
  id: NotificationType.CommentOnComment,
  audience: NotificationAudience.All,
  allowOptOut: true,
  templates: [
    {
      subjectTemplateKey: 'commentOnComment.subject',
      contentFormat: NotificationContentFormat.HTML,
      channels: [NotificationChannel.Email],
      externalBodyTemplateId: EMAIL_COMMENT_ON_COMMENT_TEMPLATE_ID,
    },
    {
      bodyTemplateKey: 'commentOnComment.plainText.body',
      contentFormat: NotificationContentFormat.PlainText,
      channels: [
        NotificationChannel.NotificationTray,
        NotificationChannel.PushNotification,
      ],
    },
  ],
})

export const queueCommentOnCommentNotification = async ({
  currentUser,
  comment,
}: QueueCommentNotification) => {
  if (!comment.content) {
    return
  }

  const commentId = comment.entityId

  const originalComment = await CommentModel.findById(commentId).populate(
    commentPopulationPaths
  )

  if (!originalComment) {
    throw new Error('Original comment not found')
  }

  const replier = comment.createdBy as User
  const originalCommenter = originalComment.createdBy as User

  const originalCommentDate = createUserDateTime(
    originalComment.createdAt,
    originalCommenter
  )
  const replyCommentDate = createUserDateTime(
    comment.createdAt,
    originalCommenter
  )

  let viewCommentUrl = ''

  switch (originalComment.entityType) {
    case CommentEntityType.Expert:
      viewCommentUrl = urlJoinWithQuery(
        `${APP_URL}/expert/${originalComment.entityId}/reviews`,
        {
          commentId: comment.id,
        }
      )
      break
    case CommentEntityType.Session:
      // eslint-disable-next-line no-case-declarations
      const session = await getSessionById(originalComment.entityId)
      if (!session) {
        throw new Error('Invalid session id')
      }
      // eslint-disable-next-line no-case-declarations
      const sessionExpert = session.expert as Expert
      viewCommentUrl = urlJoinWithQuery(
        `${APP_URL}/expert/${sessionExpert.id}/reviews`,
        {
          commentId: comment.id,
        }
      )
      break
  }

  const payload: CommentOnCommentPayload = {
    ...getCommentPayloadProps(comment, originalCommenter),
    originalCommentFirstName: originalCommenter.firstName,
    originalCommenterProfileImageUrl: await getUserAvatarUrl(originalCommenter),
    originalCommenterFullName: `${replier.firstName} ${replier.lastName}`,
    originalComment: originalComment.content || '',
    originalCommentDate: originalCommentDate.toLocaleString(DateTime.DATE_MED),
    originalCommentTime: originalCommentDate.toLocaleString(
      DateTime.TIME_SIMPLE
    ),
    replierFullName: `${replier.firstName} ${replier.lastName}`,
    replierFirstName: replier.firstName,
    replierComment: comment.content,
    replierCommentDate: replyCommentDate.toLocaleString(DateTime.DATE_MED),
    replierCommentTime: replyCommentDate.toLocaleString(DateTime.TIME_SIMPLE),
    replierProfileImageUrl: await getUserAvatarUrl(replier),
    viewCommentUrl,
  }

  await queueNotification({
    currentUser,
    targetUser: originalCommenter,
    referencedUser: replier,
    config: CommentOnCommentConfig,
    payload,
  })
}

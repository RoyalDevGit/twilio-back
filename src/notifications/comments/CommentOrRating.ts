import { Comment } from 'models/Comment'
import { Expert, ExpertModel } from 'models/Expert'
import {
  NotificationChannel,
  NotificationContentFormat,
  NotificationType,
  NotificationConfig,
  NotificationAudience,
} from 'models/NotificationConfig'
import { User } from 'models/User'
import { getSessionById } from 'repositories/session/getSessionById'
import { Env } from 'utils/env'
import { getUserAvatarUrl } from 'utils/url/getUserAvatarUrl'
import { urlJoinWithQuery } from 'utils/url/urlJoinWithQuery'
import { queueNotification } from 'utils/notifications/queueNotification'
import { expertPopulationPaths } from 'repositories/expert/populateExpert'
import { Session } from 'models/Session'
import {
  CommentNotificationBasePayload,
  getCommentPayloadProps,
  QueueCommentNotification,
} from 'notifications/comments/common'
import { queueExpertThankYouNoteNotification } from 'notifications/comments/ExpertThankYouNote'

const APP_URL = Env.getString('APP_URL')

const EMAIL_EXPERT_COMMENT_AND_RATING_TEMPLATE_ID = Env.getString(
  'EMAIL_EXPERT_COMMENT_AND_RATING_TEMPLATE_ID'
)

export const ExpertCommentAndRatingConfig = new NotificationConfig({
  id: NotificationType.ExpertCommentAndRating,
  audience: NotificationAudience.Expert,
  allowOptOut: true,
  templates: [
    {
      subjectTemplateKey: 'expertRatingAndComment.subject',
      contentFormat: NotificationContentFormat.HTML,
      channels: [NotificationChannel.Email],
      externalBodyTemplateId: EMAIL_EXPERT_COMMENT_AND_RATING_TEMPLATE_ID,
    },
    {
      bodyTemplateKey: 'expertRatingAndComment.plainText.body',
      contentFormat: NotificationContentFormat.PlainText,
      channels: [
        NotificationChannel.NotificationTray,
        NotificationChannel.PushNotification,
      ],
    },
  ],
})

const EMAIL_EXPERT_RATING_TEMPLATE_ID = Env.getString(
  'EMAIL_EXPERT_RATING_TEMPLATE_ID'
)

export const ExpertRatingConfig = new NotificationConfig({
  id: NotificationType.ExpertRating,
  audience: NotificationAudience.Expert,
  allowOptOut: true,
  templates: [
    {
      subjectTemplateKey: 'expertRating.subject',
      contentFormat: NotificationContentFormat.HTML,
      channels: [NotificationChannel.Email],
      externalBodyTemplateId: EMAIL_EXPERT_RATING_TEMPLATE_ID,
    },
    {
      bodyTemplateKey: 'expertRating.plainText.body',
      contentFormat: NotificationContentFormat.PlainText,
      channels: [
        NotificationChannel.NotificationTray,
        NotificationChannel.PushNotification,
      ],
    },
  ],
})

const EMAIL_EXPERT_COMMENT_TEMPLATE_ID = Env.getString(
  'EMAIL_EXPERT_COMMENT_TEMPLATE_ID'
)

export const ExpertCommentConfig = new NotificationConfig({
  id: NotificationType.ExpertComment,
  audience: NotificationAudience.Expert,
  allowOptOut: true,
  templates: [
    {
      subjectTemplateKey: 'expertComment.subject',
      contentFormat: NotificationContentFormat.HTML,
      channels: [NotificationChannel.Email],
      externalBodyTemplateId: EMAIL_EXPERT_COMMENT_TEMPLATE_ID,
    },
    {
      bodyTemplateKey: 'expertComment.plainText.body',
      contentFormat: NotificationContentFormat.PlainText,
      channels: [
        NotificationChannel.NotificationTray,
        NotificationChannel.PushNotification,
      ],
    },
  ],
})

interface ExpertCommentOrRatingPayload extends CommentNotificationBasePayload {
  sessionId?: string
  expertId: string
  consumerId: string
  expertFirstName: string
  consumerProfileImageUrl: string
  consumerFullName: string
  consumerFirstName: string
  consumerComment?: string
}

interface QueueExpertRatingNotificationOptions {
  currentUser: User
  comment: Comment
  expert: Expert
  session?: Session
}

const queueExpertRatingNotification = async ({
  currentUser,
  comment,
  expert,
  session,
}: QueueExpertRatingNotificationOptions) => {
  const hasComment = !!comment.content?.trim()
  const hasRating = !!comment.ratings?.overall

  if (!hasComment && hasRating) {
    return
  }

  const consumer = comment.createdBy as User

  const payload: ExpertCommentOrRatingPayload = {
    ...getCommentPayloadProps(comment, expert.user),
    sessionId: session?.id,
    expertId: expert.id,
    consumerId: consumer.id,
    expertFirstName: expert.user.firstName,
    consumerProfileImageUrl: await getUserAvatarUrl(consumer),
    consumerFullName: `${consumer.firstName} ${consumer.lastName}`,
    consumerFirstName: consumer.firstName,
    consumerComment: comment.content,
    viewCommentUrl: urlJoinWithQuery(`${APP_URL}/expert/${expert.id}/reviews`, {
      commentId: comment.id,
    }),
  }

  if (hasComment && hasRating) {
    return queueNotification({
      currentUser,
      targetUser: expert.user,
      referencedUser: consumer,
      config: ExpertCommentAndRatingConfig,
      payload,
    })
  }

  if (hasComment && !hasRating) {
    return queueNotification({
      currentUser,
      targetUser: expert.user,
      referencedUser: consumer,
      config: ExpertCommentConfig,
      payload,
    })
  }

  return queueNotification({
    currentUser,
    targetUser: expert.user,
    referencedUser: consumer,
    config: ExpertRatingConfig,
    payload,
  })
}

export const queueSessionCommentNotification = async ({
  currentUser,
  comment,
}: QueueCommentNotification) => {
  const sessionId = comment.entityId
  const session = await getSessionById(sessionId)
  if (!session) {
    throw new Error('Invalid session id')
  }
  const expert = session.expert as Expert
  const consumer = session.consumer as User
  const commenter = comment.createdBy as User
  const commenterIsExpert = expert.user.id === commenter.id
  const commenterIsConsumer = consumer.id === commenter.id

  if (commenterIsExpert) {
    return queueExpertThankYouNoteNotification({
      currentUser,
      comment,
      session,
    })
  }

  if (commenterIsConsumer) {
    return queueExpertRatingNotification({
      currentUser,
      comment,
      expert,
      session,
    })
  }
}

export const queueExpertCommentNotification = async ({
  currentUser,
  comment,
}: QueueCommentNotification) => {
  const expertId = comment.entityId
  const expert = await ExpertModel.findById(expertId).populate(
    expertPopulationPaths
  )
  if (!expert) {
    throw new Error('Invalid expert id')
  }

  return queueExpertRatingNotification({ currentUser, comment, expert })
}

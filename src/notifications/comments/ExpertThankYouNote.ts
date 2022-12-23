import { Comment } from 'models/Comment'
import { Expert } from 'models/Expert'
import {
  NotificationChannel,
  NotificationContentFormat,
  NotificationType,
  NotificationConfig,
  NotificationAudience,
} from 'models/NotificationConfig'
import { User } from 'models/User'
import { Env } from 'utils/env'
import { queueNotification } from 'utils/notifications/queueNotification'
import { Session } from 'models/Session'
import {
  CommentNotificationBasePayload,
  getCommentPayloadProps,
} from 'notifications/comments/common'
import { getUserAvatarUrl } from 'utils/url/getUserAvatarUrl'

const EMAIL_EXPERT_THANK_YOU_NOTE_TEMPLATE_ID = Env.getString(
  'EMAIL_EXPERT_THANK_YOU_NOTE_TEMPLATE_ID'
)

export const ExpertThankYouNoteConfig = new NotificationConfig({
  id: NotificationType.ExpertThankYouNoteConfig,
  audience: NotificationAudience.Consumer,
  allowOptOut: true,
  templates: [
    {
      subjectTemplateKey: 'expertThankYouNote.subject',
      contentFormat: NotificationContentFormat.HTML,
      channels: [NotificationChannel.Email],
      externalBodyTemplateId: EMAIL_EXPERT_THANK_YOU_NOTE_TEMPLATE_ID,
    },
    {
      bodyTemplateKey: 'expertThankYouNote.plainText.body',
      contentFormat: NotificationContentFormat.PlainText,
      channels: [
        NotificationChannel.NotificationTray,
        NotificationChannel.PushNotification,
      ],
    },
  ],
})

interface ExpertThankYouNoteNotificationPayload
  extends CommentNotificationBasePayload {
  expertId: string
  consumerId: string
  sessionId: string
  consumerFirstName: string
  expertFullName: string
  expertFirstName: string
  expertComment: string
  expertProfileImageUrl: string
}

interface QueueExpertThankYouNoteNotificationOptions {
  currentUser: User
  comment: Comment
  session: Session
}

export const queueExpertThankYouNoteNotification = async ({
  currentUser,
  comment,
  session,
}: QueueExpertThankYouNoteNotificationOptions) => {
  if (!comment.content) {
    return
  }
  const expert = session.expert as Expert
  const consumer = session.consumer as User
  const payload: ExpertThankYouNoteNotificationPayload = {
    ...getCommentPayloadProps(comment, consumer),
    sessionId: session.id,
    expertId: expert.id,
    consumerId: consumer.id,
    consumerFirstName: consumer.firstName,
    expertFullName: `${expert.user.firstName} ${expert.user.lastName}`,
    expertFirstName: expert.user.firstName,
    expertComment: comment.content,
    expertProfileImageUrl: await getUserAvatarUrl(expert.user),
  }

  await queueNotification({
    currentUser,
    targetUser: consumer,
    referencedUser: expert.user,
    config: ExpertThankYouNoteConfig,
    payload,
  })
}

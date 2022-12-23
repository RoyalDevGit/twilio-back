export enum NotificationType {
  ExpertCommentAndRating = 'expert_comment_and_rating',
  ExpertRating = 'expert_rating',
  ExpertComment = 'expert_comment',
  ExpertThankYouNoteConfig = 'expert_thank_you_note_config',
  CommentOnComment = 'comment_on_comment',
  ExpertFollow = 'expert_follow',
  SessionOrderConfirmation = 'session_order_confirmation',
  InstantSessionOrderConfirmation = 'instant_session_order_confirmation',
  SessionExtensionOrderConfirmation = 'session_extension_order_confirmation',
  SimpleMessage = 'simple_message',
  RecordingAvailable = 'recording_avaiable',
  ResetPassword = 'reset_password',
  VerifyEmail = 'verify_email',
  Welcome = 'welcome',
  UpcomingSession = 'upcoming_session',
  MissedSession = 'missed_session',
  MissedSessionApology = 'missed_session_apology',
  SessionCancelledWithFullRefund = 'session_cancelled_with_full_refund',
  SessionCancelledWithPartialRefund = 'session_cancelled_with_partial_refund',
  SessionCancelledByExpert = 'session_cancelled_by_expert',
  SessionFailedPaymentCancellation = 'session_cancelled_due_to_payment_failure',
  FailedSessionPayment = 'failed_session_payment',
  SessionRescheduled = 'session_rescheduled',
  CapturedSessionPayment = 'captured_session_payment',
}

export enum NotificationAudience {
  All = 'all',
  Expert = 'expert',
  Consumer = 'consumer',
}

export enum NotificationChannel {
  NotificationTray = 'notification_tray',
  Email = 'email',
  PushNotification = 'push_notification',
  SMS = 'sms',
}

export enum NotificationContentFormat {
  PlainText = 'plain_text',
  HTML = 'html',
}

export interface TemplateConfig {
  contentFormat: NotificationContentFormat
  channels: NotificationChannel[]
  externalBodyTemplateId?: string
  bodyTemplateKey?: string
  subjectTemplateKey?: string
  quiet?: boolean
  preventSelfNotifications?: boolean
}

export const AllNotificationConfigs: NotificationConfig[] = []

export class NotificationConfig {
  id!: NotificationType
  audience!: NotificationAudience
  allowOptOut!: boolean
  templates!: TemplateConfig[]

  constructor(options: Omit<NotificationConfig, 'getChannels'>) {
    AllNotificationConfigs.push(this)
    Object.assign(this, options)
  }

  getChannels() {
    const channels: NotificationChannel[] = []
    this.templates.forEach((template) => {
      channels.push(...template.channels)
    })
    return channels
  }
}

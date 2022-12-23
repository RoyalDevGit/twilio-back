import { SessionDurationOptionSchema } from 'openapi/schemas/SessionDurationOptionSchema'
import {
  ExpertAvailabilitySchema,
  ExpertAvailableTimeSlotSchema,
  ExpertIntroWizardStatusSchema,
  ExpertSchema,
  ExpertUpdateSchema,
  ExpertInstantAvailabilitySchema,
} from 'openapi/schemas/ExpertSchema'
import { mergeOpenApiSchemas } from 'utils/openapi/mergeOpenApiSchemas'
import { LoginInfoSchema } from 'openapi/schemas/LoginInfoSchema'
import { TokenResponseSchema } from 'openapi/schemas/TokenResponseSchema'
import { ApiErrorSchema } from 'openapi/schemas/ApiErrorSchema'
import { SignupInfoSchema } from 'openapi/schemas/SignupInfoSchema'
import { EmailVerificationBodySchema } from 'openapi/schemas/EmailVerificationBodySchema'
import { SendResetPasswordLinkBodySchema } from 'openapi/schemas/SendResetPasswordLinkBodySchema'
import { PasswordResetBodySchema } from 'openapi/schemas/PasswordResetBodySchema'
import {
  AuthenticatorInfoSchema,
  TwoFactorAuthMethodSchema,
  TwoFactorAuthSettingsSchema,
} from 'openapi/schemas/TwoFactorAuthSettingsSchema'
import {
  ColorSchemePreferenceSchema,
  UserRoleSchema,
  UserSchema,
  UserSettingsSchema,
  UserStatusUpdateSchema,
  UserUpdateSchema,
} from 'openapi/schemas/UserSchema'
import { UpdateUserProfileImageBodySchema } from 'openapi/schemas/UpdateUserProfileImageBodySchema'
import {
  CategoryCreationSchema,
  CategoryMultipartFormSchema,
  CategorySchema,
  CategoryStatusSchema,
} from 'openapi/schemas/CategorySchema'
import {
  ArticleCreationSchema,
  ArticleMultipartFormSchema,
  ArticleSchema,
  ArticleStatusSchema,
} from 'openapi/schemas/ArticleSchema'
import {
  EventCreationSchema,
  EventWithExpertCreationSchema,
  EventSchema,
} from 'openapi/schemas/EventSchema'
import {
  EventRecursionCreationSchema,
  EventRecursionSchema,
} from 'openapi/schemas/EventRecursionSchema'
import { EventDateSchema } from 'openapi/schemas/EventDateSchema'
import {
  EventReservationCreationSchema,
  EventReservationSchema,
} from 'openapi/schemas/EventReservationSchema'
import { WeekdaySchema } from 'openapi/schemas/WeekdaySchema'
import { EventFrequencySchema } from 'openapi/schemas/EventFrequencySchema'
import { MonthSchema } from 'openapi/schemas/MonthSchema'
import { ApiErrorCodeSchema } from 'openapi/schemas/ApiErrorCodeSchema'
import {
  VideoStatusSchema,
  VideoVisibilitySchema,
  VideoAudienceSchema,
  VideoCreationSchema,
  VideoWithExpertCreationSchema,
  VideoSchema,
  VideoUploadSchema,
  VideoUpdateSchema,
  VideoThumbnailSchema,
  VideoThumbnailTypeSchema,
  VideoTypeSchema,
} from 'openapi/schemas/VideoSchema'
import {
  QueryRequestSchema,
  QueryResponseSchema,
} from 'openapi/schemas/QuerySchema'
import {
  FileTrackerStatusSchema,
  FileTrackerSchema,
} from 'openapi/schemas/FileTrackerSchema'
import {
  CommentCreationSchema,
  CommentEntityTypeSchema,
  CommentLikeStatusValueSchema,
  CommentSchema,
  CommentTypeSchema,
  CommentUpdateSchema,
  RatingsSchema,
} from 'openapi/schemas/CommentSchema'
import {
  LanguageCreationSchema,
  LanguageMultipartFormSchema,
  LanguageSchema,
  LanguageStatusSchema,
} from 'openapi/schemas/LanguageSchema'
import {
  SessionStatusSchema,
  SessionSchema,
  SessionJoinInfoSchema,
  SessionAttendeeSchema,
  SessionStatusCountsSchema,
  SessionCancellationSchema,
  SessionRescheduleSchema,
  SessionExtensionRequestSchema,
  SessionExtensionRequestStatusSchema,
  SessionExtensionRequestCreationSchema,
} from 'openapi/schemas/SessionSchema'
import {
  ApplyToAllAvailabilityOptionsBodySchema,
  AvailabilityOptionSchema,
  AvailabilityOptionTimeRangeSchema,
} from 'openapi/schemas/AvailabilityOptionSchema'
import { BlockoutDateSchema } from 'openapi/schemas/BlockoutDateSchema'
import { PriceSchema } from 'openapi/schemas/PriceSchema'
import {
  CardPaymentMethodSchema,
  PaymentMethodSchema,
  PaymentMethodStatusSchema,
  PaymentMethodTypeSchema,
} from 'openapi/schemas/PaymentMethodSchema'
import {
  OrderItemSchema,
  OrderItemTypeSchema,
  OrderRefundStatusSchema,
  OrderSchema,
  OrderStatusSchema,
  RefundRequestSchema,
  SessionOrderItemSchema,
} from 'openapi/schemas/OrderSchema'
import { PhoneNumberSchema } from 'openapi/schemas/PhoneNumberSchema'
import { UserStatusSchema } from 'openapi/paths/UserPath'
import { SearchResultSchema } from 'openapi/schemas/SearchResultSchema'
import { ChangePasswordSchema } from 'openapi/schemas/ChangePasswordSchema'
import {
  NotificationStatusSchema,
  NotificationResponseSchema,
  MarkNotificationAsReadPayloadSchema,
} from 'openapi/schemas/NotificationSchema'
import { TimeZoneSchema } from 'openapi/schemas/TimeZoneSchema'
import {
  ChannelMessageCreationSchema,
  ChannelMessageEmbeddedMetadataSchema,
  ChannelMessageMultipartFormSchema,
  ChannelMessageSchema,
  ChannelMessageSenderInfoSchema,
  MessagingChannelStatusSchema,
  MessagingChannelSchema,
  SetMessagingChannelStatusBodySchema,
} from 'openapi/schemas/MessagingChannelSchema'
import { CreateGuestUserSchema } from 'openapi/schemas/CreateGuestUserSchema'

export const allSchemas = mergeOpenApiSchemas([
  LoginInfoSchema,
  TokenResponseSchema,
  ApiErrorCodeSchema,
  ApiErrorSchema,
  SignupInfoSchema,
  EmailVerificationBodySchema,
  SendResetPasswordLinkBodySchema,
  PasswordResetBodySchema,
  ColorSchemePreferenceSchema,
  UserSettingsSchema,
  UserRoleSchema,
  UserSchema,
  UserUpdateSchema,
  CreateGuestUserSchema,
  TwoFactorAuthSettingsSchema,
  UpdateUserProfileImageBodySchema,
  UserStatusSchema,
  ExpertIntroWizardStatusSchema,
  ExpertSchema,
  ExpertUpdateSchema,
  UserStatusUpdateSchema,
  CategoryCreationSchema,
  CategoryStatusSchema,
  CategorySchema,
  CategoryMultipartFormSchema,
  ArticleCreationSchema,
  ArticleStatusSchema,
  ArticleSchema,
  ArticleMultipartFormSchema,
  EventCreationSchema,
  EventWithExpertCreationSchema,
  EventSchema,
  EventRecursionCreationSchema,
  EventRecursionSchema,
  EventDateSchema,
  EventReservationCreationSchema,
  EventReservationSchema,
  EventFrequencySchema,
  WeekdaySchema,
  MonthSchema,
  VideoTypeSchema,
  VideoStatusSchema,
  VideoVisibilitySchema,
  VideoAudienceSchema,
  VideoCreationSchema,
  VideoWithExpertCreationSchema,
  VideoThumbnailTypeSchema,
  VideoThumbnailSchema,
  VideoSchema,
  VideoUploadSchema,
  VideoUpdateSchema,
  QueryRequestSchema,
  QueryResponseSchema,
  FileTrackerStatusSchema,
  FileTrackerSchema,
  CommentTypeSchema,
  CommentEntityTypeSchema,
  RatingsSchema,
  CommentCreationSchema,
  CommentUpdateSchema,
  CommentSchema,
  CommentLikeStatusValueSchema,
  LanguageStatusSchema,
  LanguageCreationSchema,
  LanguageSchema,
  LanguageMultipartFormSchema,
  SessionStatusSchema,
  SessionSchema,
  SessionAttendeeSchema,
  SessionJoinInfoSchema,
  SessionDurationOptionSchema,
  SessionCancellationSchema,
  SessionRescheduleSchema,
  SessionExtensionRequestCreationSchema,
  SessionExtensionRequestStatusSchema,
  SessionExtensionRequestSchema,
  AvailabilityOptionTimeRangeSchema,
  AvailabilityOptionSchema,
  ApplyToAllAvailabilityOptionsBodySchema,
  BlockoutDateSchema,
  ExpertAvailableTimeSlotSchema,
  ExpertAvailabilitySchema,
  ExpertInstantAvailabilitySchema,
  PriceSchema,
  PaymentMethodStatusSchema,
  PaymentMethodTypeSchema,
  PaymentMethodSchema,
  CardPaymentMethodSchema,
  OrderStatusSchema,
  OrderItemTypeSchema,
  SessionOrderItemSchema,
  OrderItemSchema,
  OrderSchema,
  TwoFactorAuthMethodSchema,
  TwoFactorAuthSettingsSchema,
  AuthenticatorInfoSchema,
  PhoneNumberSchema,
  SessionStatusCountsSchema,
  OrderRefundStatusSchema,
  RefundRequestSchema,
  SearchResultSchema,
  ChangePasswordSchema,
  NotificationStatusSchema,
  NotificationResponseSchema,
  MarkNotificationAsReadPayloadSchema,
  TimeZoneSchema,
  MessagingChannelStatusSchema,
  MessagingChannelSchema,
  ChannelMessageCreationSchema,
  ChannelMessageMultipartFormSchema,
  SetMessagingChannelStatusBodySchema,
  ChannelMessageSenderInfoSchema,
  ChannelMessageEmbeddedMetadataSchema,
  ChannelMessageSchema,
])

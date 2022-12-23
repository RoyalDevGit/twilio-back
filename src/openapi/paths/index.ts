import { ExpertPath } from 'openapi/paths/ExpertPath'
import { mergeOpenApiPaths } from 'utils/openapi/mergeOpenApiPaths'
import { AuthPath } from 'openapi/paths/AuthPath'
import { OAuthPath } from 'openapi/paths/OAuthPath'
import { CategoryPath } from 'openapi/paths/CategoryPath'
import { UserPath } from 'openapi/paths/UserPath'
import { VideoPath } from 'openapi/paths/VideoPath'
import { CommentPath } from 'openapi/paths/CommentPath'
import { SessionPath } from 'openapi/paths/SessionPath'
import { PaymentMethodPath } from 'openapi/paths/PaymentMethodPath'
import { OrderPath } from 'openapi/paths/OrderPath'
import { SearchPath } from 'openapi/paths/SearchPath'
import { NotificationPath } from 'openapi/paths/NotificationPath'
import { LanguagePath } from 'openapi/paths/LanguagePath'
import { TimeZonePath } from 'openapi/paths/TimeZonePath'
import { MessagingPath } from 'openapi/paths/MessagingPath'
import { ArticlePath } from 'openapi/paths/ArticlePath'

export const allPaths = mergeOpenApiPaths([
  ArticlePath,
  AuthPath,
  OAuthPath,
  CategoryPath,
  UserPath,
  ExpertPath,
  VideoPath,
  CommentPath,
  SessionPath,
  PaymentMethodPath,
  OrderPath,
  SearchPath,
  NotificationPath,
  LanguagePath,
  TimeZonePath,
  MessagingPath,
])

import { Express } from 'express'

import { authRouterPathPrefix, AuthRouter } from 'routers/AuthRouter'
import { userRouterPathPrefix, UserRouter } from 'routers/UserRouter'
import { actionRouterPathPrefix, ActionRouter } from 'routers/ActionRouter'
import { expertRouterPathPrefix, ExpertRouter } from 'routers/ExpertRouter'
import { videoRouterPathPrefix, VideoRouter } from 'routers/VideoRouter'
import { commentRouterPathPrefix, CommentRouter } from 'routers/CommentRouter'
import {
  facebookOAuthRouterPathPrefix,
  FacebookOAuthRouter,
} from 'routers/OAuthRouters/FacebookOAuthRouter'
import {
  googleOAuthRouterPathPrefix,
  GoogleOAuthRouter,
} from 'routers/OAuthRouters/GoogleOAuthRouter'
import {
  appleOAuthRouterPathPrefix,
  AppleOAuthRouter,
} from 'routers/OAuthRouters/AppleOAuthRouter'
import {
  sharedOAuthRouterPathPrefix,
  SharedOAuthRouter,
} from 'routers/OAuthRouters/SharedOAuthRouter'
import {
  microsoftOAuthRouterPathPrefix,
  MicrosoftOAuthRouter,
} from 'routers/OAuthRouters/MicrosoftOAuthRouter'
import {
  notificationsRouterPathPrefix,
  NotificationsRouter,
} from 'routers/NotificationRouter'
import {
  paymentMethodRouterPathPrefix,
  PaymentMethodRouter,
} from 'routers/PaymentMethodRouter'
import { sessionRouterPathPrefix, SessionRouter } from 'routers/SessionRouter'
import {
  chimeEventRouterPathPrefix,
  ChimeEventRouter,
} from 'routers/ChimeEventRouter'
import { OrderRouter, orderRouterPathPrefix } from 'routers/OrderRouter'
import {
  CategoryRouter,
  categoryRouterPathPrefix,
} from 'routers/CategoryRouter'
import { ArticleRouter, articleRouterPathPrefix } from 'routers/ArticleRouter'
import { SearchRouter, searchRouterPathPrefix } from 'routers/SearchRouter'
import {
  languageRouterPathPrefix,
  LanguageRouter,
} from 'routers/LanguageRouter'
import {
  TimeZoneRouter,
  timeZoneRouterPathPrefix,
} from 'routers/TimeZoneRouter'
import {
  MessagingRouter,
  messagingRouterPathPrefix,
} from 'routers/MessagingRouter'

export const configureRouters = (app: Express) => {
  app.use(authRouterPathPrefix, AuthRouter)
  app.use(sharedOAuthRouterPathPrefix, SharedOAuthRouter)
  app.use(facebookOAuthRouterPathPrefix, FacebookOAuthRouter)
  app.use(googleOAuthRouterPathPrefix, GoogleOAuthRouter)
  app.use(appleOAuthRouterPathPrefix, AppleOAuthRouter)
  app.use(microsoftOAuthRouterPathPrefix, MicrosoftOAuthRouter)
  app.use(userRouterPathPrefix, UserRouter)
  app.use(actionRouterPathPrefix, ActionRouter)
  app.use(expertRouterPathPrefix, ExpertRouter)
  app.use(videoRouterPathPrefix, VideoRouter)
  app.use(commentRouterPathPrefix, CommentRouter)
  app.use(sessionRouterPathPrefix, SessionRouter)
  app.use(paymentMethodRouterPathPrefix, PaymentMethodRouter)
  app.use(orderRouterPathPrefix, OrderRouter)
  app.use(chimeEventRouterPathPrefix, ChimeEventRouter)
  app.use(categoryRouterPathPrefix, CategoryRouter)
  app.use(searchRouterPathPrefix, SearchRouter)
  app.use(notificationsRouterPathPrefix, NotificationsRouter)
  app.use(languageRouterPathPrefix, LanguageRouter)
  app.use(timeZoneRouterPathPrefix, TimeZoneRouter)
  app.use(messagingRouterPathPrefix, MessagingRouter)
  app.use(articleRouterPathPrefix, ArticleRouter)
}

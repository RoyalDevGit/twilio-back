import express from 'express'
import passport from 'passport'
import morgan from 'morgan'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import expressSession from 'express-session'
import cors from 'cors'

import { configureRouters } from 'routers/configureRouters'
import { i18nMiddleware } from 'middleware/i18nMiddleware'
import { Env } from 'utils/env'
import { configureDocs } from 'openapi/configureDocs'
import { errorHandlerMiddleware } from 'middleware/errorHandlerMiddleware'
import { configureHealthCheck } from 'middleware/healthCheckMiddleware'

const CORS_ALLOWED_ORIGIN = Env.getString('CORS_ALLOWED_ORIGIN')

export const app = express()
app.use(
  cors({ origin: [...CORS_ALLOWED_ORIGIN.split(',')], credentials: true })
)
app.use(morgan('tiny'))
app.use(cookieParser())
app.use(bodyParser.json())
//required by the passport-apple library
app.use(bodyParser.urlencoded({ extended: true }))
app.use(i18nMiddleware)
// ----------------- SESSION SETUP --------------------------------------
// This sequence of middleware is necessary for login sessions and required by passport.
// The first middleware loads session data and makes it available at `req.session`.
// The next lines initialize Passport and authenticate the request based on session
// data.
// Further docs: https://www.npmjs.com/package/express-session
app.use(
  expressSession({
    secret: Env.getString('PASSPORT_SESSION_SECRET'),
    resave: true,
    saveUninitialized: true,
  })
)
app.use(passport.initialize())
app.use(passport.session())
// ---------------- END SESSION SETUP -----------------------------------
configureHealthCheck(app)
configureDocs(app)
configureRouters(app)
app.use(errorHandlerMiddleware)

import 'isomorphic-fetch'

import cron from 'node-cron'
import { serializeError } from 'serialize-error'

import { Env } from 'utils/env'
import { initializeDaemonConnections } from 'daemon/initializeDaemonConnections'
import { sessionAttendanceAnalyzerJob } from 'daemon/jobs/sessionAttendanceAnalyzer'
import { notificationSenderJob } from 'daemon/jobs/notificationSender'
import { sessionPaymentAuthorizerJob } from 'daemon/jobs/sessionPaymentAuthorizer'
import { sessionPaymentProcessorJob } from 'daemon/jobs/sessionPaymentProcessor'
import {
  initializeNewRelicInstance,
  noticeError,
} from 'utils/newrelic/newrelic-utils'
import { unpaidSessionCancellerJob } from 'daemon/jobs/unpaidSessionCanceller'
import { upcomingSessionReminderJob } from 'daemon/jobs/upcomingSessionReminder'
import { createLogger } from 'utils/logger/createLogger'

initializeNewRelicInstance()

const logger = createLogger('es-daemon-crons')

process.on('uncaughtException', (err: Error) => {
  noticeError(err)
  logger.error('uncaughtException', serializeError(err))
})

process.on('unhandledRejection', (err: Error) => {
  noticeError(err)
  logger.error('unhandledRejection', serializeError(err))
})

const SEND_NOTIFICATIONS_CRON = Env.getString('SEND_NOTIFICATIONS_CRON')
const SESSION_ATTENDANCE_ANALYZER_CRON = Env.getString(
  'SESSION_ATTENDANCE_ANALYZER_CRON'
)
const SESSION_PAYMENT_AUTHORIZER_CRON = Env.getString(
  'SESSION_PAYMENT_AUTHORIZER_CRON'
)
const SESSION_PAYMENT_PROCESSOR_CRON = Env.getString(
  'SESSION_PAYMENT_PROCESSOR_CRON'
)
const UNPAID_SESSION_CRON = Env.getString('UNPAID_SESSION_CRON')
const UPCOMING_SESSION_CRON = Env.getString('UPCOMING_SESSION_CRON')

export const configureCrons = async (): Promise<void> => {
  cron.schedule(SEND_NOTIFICATIONS_CRON, notificationSenderJob)
  cron.schedule(SESSION_ATTENDANCE_ANALYZER_CRON, sessionAttendanceAnalyzerJob)
  cron.schedule(SESSION_PAYMENT_AUTHORIZER_CRON, sessionPaymentAuthorizerJob)
  cron.schedule(SESSION_PAYMENT_PROCESSOR_CRON, sessionPaymentProcessorJob)
  cron.schedule(UNPAID_SESSION_CRON, unpaidSessionCancellerJob)
  cron.schedule(UPCOMING_SESSION_CRON, upcomingSessionReminderJob)
}
;(async (): Promise<void> => {
  await initializeDaemonConnections()
  await configureCrons()
  logger.info(`Expert Session Daemon cron jobs started`)
})()

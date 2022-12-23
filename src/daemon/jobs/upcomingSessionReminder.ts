import { DateTime } from 'luxon'
import { serializeError } from 'serialize-error'

import { Session, SessionModel, SessionStatus } from 'models/Session'
import { queueUpcomingSessionNotifications } from 'notifications/UpcomingSessionReminder'
import { sessionPopulationPaths } from 'repositories/session/populateSession'
import { getSystemAccount } from 'repositories/user/getSystemAccount'
import { Env } from 'utils/env'
import { createLogger } from 'utils/logger/createLogger'
import { noticeError } from 'utils/newrelic/newrelic-utils'

const logger = createLogger('upcoming-session-reminder')

const SESSION_UPCOMING_REMINDER_TIME = Env.getDuration(
  'SESSION_UPCOMING_REMINDER_TIME'
)

export const upcomingSessionReminderJob = async () => {
  try {
    logger.info('Getting upcoming sessions...')
    const systemAccount = await getSystemAccount()
    const sessions = await SessionModel.find({
      $and: [
        {
          $or: [
            { upcomingSessionReminderSent: { $exists: false } },
            { upcomingSessionReminderSent: false },
          ],
        },
        { status: SessionStatus.NotStarted, instant: false },
        {
          'startDate.date': {
            $lte: DateTime.now()
              .plus({
                milliseconds: SESSION_UPCOMING_REMINDER_TIME.milliseconds,
              })
              .toJSDate(),
          },
        },
      ],
    }).populate(sessionPopulationPaths)

    logger.info(`${sessions.length} session(s) found`)
    sessions.forEach(async (session: Session) => {
      queueUpcomingSessionNotifications({
        currentUser: systemAccount,
        session,
      })
      session.upcomingSessionReminderSent = true
      await session.save()
    })
  } catch (e) {
    noticeError(e)
    logger.error(serializeError(e))
  }
}

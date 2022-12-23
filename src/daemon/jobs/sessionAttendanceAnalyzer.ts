import { DateTime } from 'luxon'
import { serializeError } from 'serialize-error'

import { Expert } from 'models/Expert'
import {
  SessionAttendanceResult,
  Session,
  SessionAttendeeModel,
  SessionModel,
  SessionStatus,
} from 'models/Session'
import { User } from 'models/User'
import {
  queueConsumerMissedSessionNotification,
  queueExpertMissedSessionApologiesNotification,
  queueExpertMissedSessionNotification,
} from 'notifications/MissedSession'
import { sessionPopulationPaths } from 'repositories/session/populateSession'
import { getSystemAccount } from 'repositories/user/getSystemAccount'
import { createLogger } from 'utils/logger/createLogger'
import { noticeError } from 'utils/newrelic/newrelic-utils'

const logger = createLogger('session-attendance-analyzer')

export const sessionAttendanceAnalyzerJob = async () => {
  try {
    logger.info('Getting sessions for attendance analysis...')
    const systemAccount = await getSystemAccount()
    const sessions = await SessionModel.find({
      $and: [
        { attendanceResult: { $exists: false } },
        {
          $and: [
            {
              status: { $ne: SessionStatus.Cancelled },
              $or: [
                {
                  $and: [
                    { ended: { $exists: false } },
                    { 'endDate.date': { $lte: DateTime.now().toJSDate() } },
                  ],
                },
                { ended: { $exists: true } },
              ],
            },
          ],
        },
      ],
    }).populate(sessionPopulationPaths)

    logger.info(`${sessions.length} session(s) found`)
    sessions.forEach(async (session: Session) => {
      const consumer = session.consumer as User
      const expert = session.expert as Expert
      const expertAttended = await SessionAttendeeModel.findOne({
        session: session.id,
        user: expert.user.id,
      })
      const consumerAttended = await SessionAttendeeModel.findOne({
        session: session.id,
        user: consumer.id,
      })
      if (!expertAttended) {
        await queueExpertMissedSessionNotification({
          currentUser: systemAccount,
          session,
        })

        await queueExpertMissedSessionApologiesNotification({
          currentUser: systemAccount,
          session,
        })
      } else if (!consumerAttended) {
        await queueConsumerMissedSessionNotification({
          currentUser: systemAccount,
          session,
        })
      }

      let attendanceResult: SessionAttendanceResult
      if (!expertAttended && !consumerAttended) {
        attendanceResult = SessionAttendanceResult.NoneShowed
      } else if (expertAttended && !consumerAttended) {
        attendanceResult = SessionAttendanceResult.NoShowConsumer
      } else if (!expertAttended && consumerAttended) {
        attendanceResult = SessionAttendanceResult.NoShowExpert
      } else {
        attendanceResult = SessionAttendanceResult.AllPresent
      }

      await SessionModel.findByIdAndUpdate(session.id, {
        attendanceResult,
      })
    })
  } catch (e) {
    noticeError(e)
    logger.error(serializeError(e))
  }
}

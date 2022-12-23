import { DateTime } from 'luxon'

import { Expert } from 'models/Expert'
import { SessionModel, SessionStatus } from 'models/Session'

export const getFutureExpertSessions = (expert: Expert) => {
  const now = DateTime.now()
  return SessionModel.find({
    status: {
      $in: [SessionStatus.NotStarted],
    },
    $or: [{ expert: expert.id }, { consumer: expert.user.id }],
    'startDate.date': {
      $gte: now.startOf('day').toUTC().toJSDate(),
    },
  })
}

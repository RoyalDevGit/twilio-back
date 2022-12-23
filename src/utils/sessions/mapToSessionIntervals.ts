import { Interval } from 'luxon'

import { Session } from 'models/Session'
import { convertEventDateToDateTime } from 'utils/date/convertEventDateToDateTime'

export const mapToSessionIntervals = (sessions: Session[]) =>
  sessions.map((s) => {
    const sessionStartDate = convertEventDateToDateTime(s.startDate)
    const sessionEndDate = sessionStartDate.plus({ minutes: s.duration })
    return Interval.fromDateTimes(sessionStartDate, sessionEndDate)
  })

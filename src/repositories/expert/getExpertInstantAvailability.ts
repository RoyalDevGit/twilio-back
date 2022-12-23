import { DateTime, Interval } from 'luxon'

import { Expert } from 'models/Expert'
import {
  SessionDurationOption,
  SessionDurationOptionModel,
} from 'models/SessionDurationOption'
import { calculateSessionPrice } from 'utils/commerce/calculateSessionPrice'
import { Session } from 'models/Session'
import { mapToSessionIntervals } from 'utils/sessions/mapToSessionIntervals'
import { getFutureExpertSessions } from 'repositories/expert/getFutureExpertSessions'
import { ExpertAvailableDuration } from 'interfaces/ExpertAvailability'
import { getExpertActiveSessions } from 'repositories/expert/getExpertActiveSessions'
import { UserStatus } from 'models/User'

interface ExpertInstantAvailabilityOptions {
  durationOptions?: SessionDurationOption[] | undefined
  futureSessions?: Session[]
  ignoreActiveSession?: boolean
}

export const getExpertInstantAvailability = async (
  expert: Expert,
  date: DateTime,
  options: ExpertInstantAvailabilityOptions = {}
) => {
  if (expert.user.status !== UserStatus.Available) {
    return []
  }

  const availableDurations: ExpertAvailableDuration[] = []
  const dateTime = date.toUTC()
  let { durationOptions, futureSessions } = options
  const { ignoreActiveSession } = options

  if (!durationOptions) {
    durationOptions = await SessionDurationOptionModel.find({
      expert: expert.id,
    })
  }

  if (!futureSessions) {
    futureSessions = await getFutureExpertSessions(expert)
  }

  if (!ignoreActiveSession) {
    const activeSessions = await getExpertActiveSessions(expert)

    if (activeSessions.length) {
      return []
    }
  }

  const sessionIntervals = mapToSessionIntervals(futureSessions)

  durationOptions.forEach((durationOption) => {
    const { duration } = durationOption
    const instantEndTime = dateTime.plus({ minutes: duration })
    const instantDateInterval = Interval.fromDateTimes(dateTime, instantEndTime)

    const overlappingSession = sessionIntervals.find((sessionInterval) =>
      instantDateInterval.overlaps(sessionInterval)
    )

    // skip if expert already has a session at this time
    if (overlappingSession) {
      return
    }

    availableDurations.push({
      minutes: duration,
      price: calculateSessionPrice(expert, duration),
    })
  })

  return availableDurations
}

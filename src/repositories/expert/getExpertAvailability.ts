import { DateTime, Interval } from 'luxon'
import objectHash from 'object-hash'
import { uniqBy, sortBy } from 'lodash'

import { Expert } from 'models/Expert'
import { ApiError, ApiErrorCode } from 'utils/error/ApiError'
import { AvailabilityOptionModel } from 'models/AvailabilityOption'
import { SessionDurationOptionModel } from 'models/SessionDurationOption'
import { BlockoutDateModel } from 'models/BlockoutDate'
import { calculateSessionPrice } from 'utils/commerce/calculateSessionPrice'
import { getDateIntervalId } from 'utils/date/getDateIntervalId'
import { mapToSessionIntervals } from 'utils/sessions/mapToSessionIntervals'
import { getFutureExpertSessions } from 'repositories/expert/getFutureExpertSessions'
import { getExpertInstantAvailability } from 'repositories/expert/getExpertInstantAvailability'
import {
  ExpertAvailability,
  ExpertAvailableTimeSlot,
} from 'interfaces/ExpertAvailability'
import { parseAvailabilityOptionTime } from 'utils/date/parseAvailabilityOptionTime'
import { User } from 'models/User'

interface GetExpertAvailabilityOptions {
  from: DateTime
  to: DateTime
  selectedDate?: DateTime
  selectedDuration?: number
  includeAllTimeSlots?: boolean
}

export const getExpertAvailability = async (
  expert: Expert,
  user: User | null | undefined,
  {
    from,
    to,
    selectedDate,
    selectedDuration,
    includeAllTimeSlots = false,
  }: GetExpertAvailabilityOptions
) => {
  const dateInterval = Interval.fromDateTimes(from, to)

  if (!dateInterval.isValid) {
    throw new ApiError('invalidDateRange', ApiErrorCode.BadRequest)
  }

  const availability: ExpertAvailability = {
    hash: '',
    from,
    to,
    selectedDate,
    selectedDuration: selectedDuration,
    dates: [],
    durations: [],
    timeSlots: [],
    instant: {
      durations: [],
    },
  }

  const availabilityOptions = await AvailabilityOptionModel.find({
    expert: expert.id,
    enabled: true,
  })

  if (!availabilityOptions.length) {
    return availability
  }

  const durationOptions = await SessionDurationOptionModel.find({
    expert: expert.id,
  })

  if (!durationOptions.length) {
    return availability
  }

  const minimumDate = DateTime.now()
    .toUTC()
    .plus({ minutes: expert.noticePeriod })

  const blockoutDates = await BlockoutDateModel.find({
    expert: expert.id,
    date: {
      $gte: DateTime.now().startOf('day').toUTC().toJSDate(),
    },
  })

  const blockoutDateHashmap = {} as Record<string, boolean>

  blockoutDates.forEach((blockoutDate) => {
    blockoutDateHashmap[DateTime.fromJSDate(blockoutDate.date).toISODate()] =
      true
  })

  const existingSessions = await getFutureExpertSessions(expert)
  const sessionIntervals = mapToSessionIntervals(existingSessions)

  const weeks = dateInterval.splitBy({ weeks: 1 })

  const [firstWeek, ...otherWeeks] = weeks

  const firstWeekDates = firstWeek.splitBy({ days: 1 }).map((d) => d.start)

  const firstWeekTimeSlots: ExpertAvailableTimeSlot[] = []

  firstWeekDates.forEach((date) => {
    const expertTimeZone = expert.user?.settings?.timeZone || 'utc'

    const localDateForExpert = date.setZone(expertTimeZone)
    const tzOffset = localDateForExpert.offset / 60

    const availabilityOption = availabilityOptions.find(
      (option) => option.weekday === date.weekday
    )

    if (!availabilityOption) {
      return
    }

    availabilityOption.ranges.forEach((range) => {
      const startTime = parseAvailabilityOptionTime(range.startTime)
      const endTime = parseAvailabilityOptionTime(range.endTime)
      const startDate = date
        .startOf('day')
        .setZone(expertTimeZone)
        .plus({
          hours: startTime.hours - tzOffset,
          minutes: startTime.minutes,
        })
        .toUTC()
      let endDate = date
        .startOf('day')
        .setZone(expertTimeZone)
        .plus({
          hours: endTime.hours - tzOffset,
          minutes: endTime.minutes,
        })
        .toUTC()

      let availabilityInterval = Interval.fromDateTimes(startDate, endDate)

      if (!availabilityInterval.isValid) {
        endDate = endDate.plus({ days: 1 })
        availabilityInterval = Interval.fromDateTimes(startDate, endDate)
      }

      if (!availabilityInterval.isValid) {
        return
      }

      durationOptions.forEach((durationOption) => {
        const durationIntervals = availabilityInterval.splitBy({
          minutes: durationOption.duration,
        })
        durationIntervals.forEach((durationInterval) => {
          const duration = durationInterval.end.diff(
            durationInterval.start,
            'minutes'
          )
          if (duration.minutes < durationOption.duration) {
            return
          }

          const timeSlotId = getDateIntervalId(
            durationInterval.start,
            durationInterval.end
          )

          if (firstWeekTimeSlots.some((t) => t.id === timeSlotId)) {
            return
          }

          firstWeekTimeSlots.push({
            id: timeSlotId,
            duration: duration.minutes,
            startDate: durationInterval.start,
            endDate: durationInterval.end,
            price: calculateSessionPrice(expert, duration.minutes),
          })
        })
      })
    })
  })

  let timeSlots: ExpertAvailableTimeSlot[] = [...firstWeekTimeSlots]
  otherWeeks.forEach((week, weekIndex) => {
    const weekNumber = weekIndex + 1
    const dates = week.splitBy({ days: 1 }).map((d) => d.start)

    firstWeekTimeSlots.forEach((slot) => {
      const weekDate = dates.find((d) => d.weekday === slot.startDate.weekday)
      if (!weekDate) {
        return
      }
      const startDate = slot.startDate.plus({ weeks: weekNumber })
      const endDate = startDate.plus({ minutes: slot.duration })
      timeSlots.push({
        ...slot,
        id: getDateIntervalId(startDate, endDate),
        startDate,
        endDate,
      })
    })
  })

  timeSlots = timeSlots.filter((slot) => {
    if (blockoutDateHashmap[slot.startDate.toISODate()]) {
      return false
    }

    // take into account the expert notice period
    if (minimumDate.diff(slot.startDate).milliseconds > 0) {
      return false
    }

    // do not allow past time slots
    if (slot.startDate.diffNow().milliseconds < 0) {
      return false
    }

    const timeSlotInterval = Interval.fromDateTimes(
      slot.startDate,
      slot.endDate
    )

    const overlappingSession = sessionIntervals.find((sessionInterval) =>
      timeSlotInterval.overlaps(sessionInterval)
    )

    // skip if expert already has a session at this time
    if (overlappingSession) {
      return false
    }

    const dateForUser = slot.startDate.setZone(
      user?.settings?.timeZone || 'utc'
    )
    const isoDate = dateForUser.toISODate()
    if (!availability.dates.includes(isoDate)) {
      availability.dates.push(isoDate)
    }

    return true
  })

  availability.nextAvailableTimeSlot = timeSlots.length
    ? sortBy(timeSlots, (ts) => ts.startDate.toSeconds())[0]
    : undefined

  if (!includeAllTimeSlots && selectedDate) {
    const currentUserSelectedDate = selectedDate.setZone(
      user?.settings?.timeZone || 'utc'
    )

    timeSlots = timeSlots.filter((timeSlot) => {
      const dateForUser = timeSlot.startDate.setZone(
        user?.settings?.timeZone || 'utc'
      )
      if (dateForUser.toISODate() === currentUserSelectedDate.toISODate()) {
        return true
      }
      return false
    })
  }

  timeSlots.forEach((timeSlot) => {
    const existingDuration = availability.durations.find(
      (d) => d.minutes === timeSlot.duration
    )
    if (existingDuration) {
      return
    }
    availability.durations.push({
      minutes: timeSlot.duration,
      price: calculateSessionPrice(expert, timeSlot.duration),
    })
  })

  if (selectedDuration) {
    timeSlots = timeSlots.filter((slot) => slot.duration === selectedDuration)
  }

  availability.timeSlots = uniqBy(timeSlots, 'id')

  // see if expert is available for instant sessions
  availability.instant.durations = await getExpertInstantAvailability(
    expert,
    DateTime.now(),
    {
      durationOptions,
      futureSessions: existingSessions,
    }
  )

  availability.hash = objectHash(availability)

  return availability
}

import {
  RRule,
  Frequency as RRuleFrequency,
  Weekday as RRuleWeekday,
} from 'rrule'
import { DateTime } from 'luxon'

import { Event, EventFrequency, EventModel, Weekday } from 'models/Event'

const getRRuleFrequency = (eventFrequency: EventFrequency): RRuleFrequency => {
  switch (eventFrequency) {
    case EventFrequency.Yearly:
      return RRuleFrequency.YEARLY
    case EventFrequency.Monthly:
      return RRuleFrequency.MONTHLY
    case EventFrequency.Weekly:
      return RRuleFrequency.WEEKLY
    case EventFrequency.Daily:
      return RRuleFrequency.DAILY
    case EventFrequency.Hourly:
      return RRuleFrequency.HOURLY
    case EventFrequency.Minutely:
      return RRuleFrequency.MINUTELY
    case EventFrequency.Secondly:
      return RRuleFrequency.SECONDLY
  }
}

const getRRuleWeekday = (eventWeekday: Weekday): RRuleWeekday => {
  switch (eventWeekday) {
    case Weekday.Sunday:
      return RRule.SU
    case Weekday.Monday:
      return RRule.MO
    case Weekday.Tuesday:
      return RRule.TU
    case Weekday.Wednesday:
      return RRule.WE
    case Weekday.Thursday:
      return RRule.TH
    case Weekday.Friday:
      return RRule.FR
    case Weekday.Saturday:
      return RRule.SA
  }
}

const getRRuleWeekdays = (
  eventWeekdays: Weekday[] | undefined
): RRuleWeekday[] | null => {
  if (!eventWeekdays?.length) {
    return null
  }
  return eventWeekdays.map(getRRuleWeekday)
}

interface Options {
  from: DateTime
  to?: DateTime
  onlyFirst?: boolean
}

export const getRecurringEventInstances = (
  event: Event,
  options: Options
): Event[] => {
  if (!event.recursion) {
    return []
  }
  const { interval, endDate, maxOccurrences, position, monthDay } =
    event.recursion
  const rule = new RRule({
    freq: getRRuleFrequency(event.recursion.frequency),
    interval,
    dtstart: event.startDate.date,
    until: endDate,
    count: maxOccurrences,
    byweekday: getRRuleWeekdays(event.recursion.weekdays),
    bysetpos: position,
    bymonthday: monthDay,
  })
  const eventRecursionDates: Date[] = []

  if (options.from && options.to) {
    eventRecursionDates.push(
      ...rule.between(options.from.toJSDate(), options.to.toJSDate(), true)
    )
  } else if (options.onlyFirst && options.from) {
    const instanceDate = rule.after(options.from.toJSDate(), true)
    if (instanceDate) {
      eventRecursionDates.push(instanceDate)
    }
  } else if (options.onlyFirst && options.to) {
    const instanceDate = rule.before(options.to.toJSDate(), true)
    if (instanceDate) {
      eventRecursionDates.push(instanceDate)
    }
  }

  const eventDuration = DateTime.fromJSDate(event.endDate.date).diff(
    DateTime.fromJSDate(event.startDate.date)
  )
  const recursionEvents: Event[] = eventRecursionDates.map((date) => {
    const recursionEvent = new EventModel(event)
    recursionEvent.isNew = true
    recursionEvent._id = undefined
    recursionEvent.parentEvent = event.id
    recursionEvent.instanceId = `${event.id}_${date.toISOString()}`
    recursionEvent.startDate.date = date
    recursionEvent.originalStartDate = recursionEvent.startDate
    recursionEvent.endDate.date = DateTime.fromJSDate(date)
      .plus(eventDuration)
      .toJSDate()
    return recursionEvent
  })
  return recursionEvents
}

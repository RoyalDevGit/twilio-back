import { DateTime } from 'luxon'

import { User } from 'models/User'

export const createUserDateTime = (date: Date | string, user: User) => {
  if (typeof date === 'string') {
    return DateTime.fromISO(date).setZone(user.settings.timeZone)
  }

  return DateTime.fromJSDate(date).setZone(user.settings.timeZone)
}

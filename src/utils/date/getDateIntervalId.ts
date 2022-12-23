import crypto from 'crypto'

import { DateTime } from 'luxon'

export const getDateIntervalId = (startDate: DateTime, endTime: DateTime) => {
  const shasum = crypto.createHash('sha1')
  shasum.update(`${startDate.toISO()}-${endTime.toISO()}`)
  return shasum.digest('hex')
}

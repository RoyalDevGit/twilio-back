import { getTimeZones } from '@vvo/tzdb'

export const getTimeZoneByName = (name: string) => {
  const tzName = name.toLowerCase().trim()
  return getTimeZones({ includeUtc: true }).find(
    (tz) => tz.name.toLowerCase() === tzName
  )
}

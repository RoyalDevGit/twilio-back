import { Duration, DurationLikeObject } from 'luxon'

type DurationUnit = keyof DurationLikeObject

interface ToHumanDurationOptions {
  smallestUnit?: DurationUnit
  largestUnit?: DurationUnit
}

export const toHumanDuration = (
  dur: Duration,
  { smallestUnit = 'seconds', largestUnit = 'years' }: ToHumanDurationOptions
): string => {
  const units: DurationUnit[] = [
    'milliseconds',
    'seconds',
    'minutes',
    'hours',
    'days',
    'months',
    'years',
  ]
  const largestIdx = units.indexOf(largestUnit)
  const smallestIdx = units.indexOf(smallestUnit)
  const relevantUnits = units.filter(
    (unit, i) => i >= smallestIdx && i <= largestIdx
  )
  const durationObject = dur
    .shiftTo(...relevantUnits)
    .normalize()
    .toObject()

  const cleanObject = {} as Record<string, number>

  Object.entries(durationObject).forEach(([key, value]) => {
    if (!value) {
      return
    }
    cleanObject[key] = value
  })

  return Duration.fromObject(cleanObject).toHuman()
}

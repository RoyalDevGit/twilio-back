export interface HumanizedMinutes {
  value: number
  unit: string
}

export const humanizeMinutes = (minutes: number): HumanizedMinutes => {
  const hours = minutes / 60

  if (hours < 1) {
    if (minutes === 1) {
      return {
        value: minutes,
        unit: 'minute',
      }
    }
    return {
      value: minutes,
      unit: 'minutes',
    }
  }

  if (hours === 1) {
    return {
      value: hours,
      unit: 'hour',
    }
  }

  return {
    value: hours,
    unit: 'hours',
  }
}

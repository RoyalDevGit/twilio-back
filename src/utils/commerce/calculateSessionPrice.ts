import { round } from 'mathjs'

import { Expert } from 'models/Expert'
import { Price } from 'models/Price'

export const calculateSessionPrice = (
  expert: Expert,
  minutes: number
): Price => {
  let calculatedPrice = 0
  if (expert.hourlyRate) {
    const minutelyRate = expert.hourlyRate / 60
    calculatedPrice = minutelyRate * minutes
  }
  return {
    currencyCode: 'USD',
    amount: round(calculatedPrice, 2),
  }
}

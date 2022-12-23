import { DateTime } from 'luxon'

import { Price } from 'models/Price'

export interface ExpertAvailableTimeSlot {
  id: string
  duration: number
  startDate: DateTime
  endDate: DateTime
  price: Price
}

export interface ExpertAvailableDuration {
  minutes: number
  price: Price
}

export interface ExpertInstantAvailability {
  durations: ExpertAvailableDuration[]
}

export interface ExpertAvailability {
  hash: string
  nextAvailableTimeSlot?: ExpertAvailableTimeSlot
  from: DateTime
  to: DateTime
  selectedDate?: DateTime
  selectedDuration?: number
  dates: string[]
  durations: ExpertAvailableDuration[]
  timeSlots: ExpertAvailableTimeSlot[]
  instant: ExpertInstantAvailability
}

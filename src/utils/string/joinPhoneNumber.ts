import { PhoneNumber } from 'models/PhoneNumber'

export const joinPhoneNumber = (phoneNumber: PhoneNumber) =>
  `+${phoneNumber.countryCode}${phoneNumber.number}`

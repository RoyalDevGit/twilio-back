import { Schema } from 'mongoose'

import { pick } from 'utils/object/pick'

export interface PhoneNumber {
  countryCode: string
  number: string
}

export const PhoneNumberSchema = new Schema<PhoneNumber>({
  countryCode: { type: String, required: true },
  number: { type: String, required: true },
})

const serializePhoneNumber = (phoneNumber: PhoneNumber): PhoneNumber =>
  pick(phoneNumber, 'countryCode', 'number') as PhoneNumber

PhoneNumberSchema.methods.toJSON = function (
  this: PhoneNumber
): Partial<PhoneNumber> {
  return serializePhoneNumber(this)
}

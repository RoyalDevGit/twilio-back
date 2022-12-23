import { DefaultTextField } from 'search/mappings/common'

export const PhoneNumberMappings = {
  dynamic: true,
  properties: {
    countryCode: DefaultTextField,
    number: DefaultTextField,
  },
}

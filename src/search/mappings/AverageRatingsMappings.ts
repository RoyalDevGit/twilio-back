import { DefaultLongField, DefaultTextField } from 'search/mappings/common'

export const AverageRatingsMappings = {
  dynamic: true,
  properties: {
    _id: DefaultTextField,
    overall: {
      dynamic: true,
      properties: {
        _id: DefaultTextField,
        count: DefaultLongField,
        rating: DefaultLongField,
      },
    },
  },
}

import { OpenAPIV3_1 } from 'openapi-types'

import { Weekday } from 'models/Event'
import { getEnumValues } from 'utils/enum/enumUtils'

export const WeekdaySchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  Weekday: {
    type: 'integer',
    description: 'Days of the week from 1-7 (1 = Monday, 7 = Sunday)',
    enum: getEnumValues(Weekday),
    example: Weekday.Monday,
  },
}

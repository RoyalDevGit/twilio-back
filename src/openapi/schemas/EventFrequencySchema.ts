import { OpenAPIV3_1 } from 'openapi-types'

import { EventFrequency } from 'models/Event'
import { getEnumValues } from 'utils/enum/enumUtils'

export const EventFrequencySchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  EventFrequency: {
    type: 'string',
    enum: getEnumValues(EventFrequency),
    example: EventFrequency.Weekly,
  },
}

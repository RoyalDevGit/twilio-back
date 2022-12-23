import { OpenAPIV3_1 } from 'openapi-types'

import { Month } from 'models/Event'
import { getEnumValues } from 'utils/enum/enumUtils'

export const MonthSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  Month: {
    type: 'integer',
    description: 'Months of the year from 1-12 (1 = January, 12 = December)',
    enum: getEnumValues(Month),
    example: Month.February,
  },
}

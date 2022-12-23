import { OpenAPIV3_1 } from 'openapi-types'

import { getEnumValues } from 'utils/enum/enumUtils'
import { ApiErrorCode } from 'utils/error/ApiError'

export const ApiErrorCodeSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  ApiErrorCode: {
    type: 'string',
    enum: getEnumValues(ApiErrorCode),
    example: 'NOT_FOUND',
  },
}

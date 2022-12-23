import { OpenAPIV3_1 } from 'openapi-types'

export const mergeOpenApiParams = (
  schemaObjects: Record<string, OpenAPIV3_1.ParameterObject>[]
) => {
  const mergedObject: Record<string, OpenAPIV3_1.ParameterObject> = {}
  schemaObjects.forEach((schemaObject) => {
    Object.entries(schemaObject).forEach(([key, value]) => {
      mergedObject[key] = value
    })
  })
  return mergedObject
}

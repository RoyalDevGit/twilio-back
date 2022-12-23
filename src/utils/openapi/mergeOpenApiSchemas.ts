import { OpenAPIV3_1 } from 'openapi-types'

export const mergeOpenApiSchemas = (
  schemaObjects: Record<string, OpenAPIV3_1.SchemaObject>[]
) => {
  const mergedObject: Record<string, OpenAPIV3_1.SchemaObject> = {}
  schemaObjects.forEach((schemaObject) => {
    Object.entries(schemaObject).forEach(([key, value]) => {
      mergedObject[key] = value
    })
  })
  return mergedObject
}

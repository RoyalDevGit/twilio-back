import { OpenAPIV3_1 } from 'openapi-types'
import urlJoin from 'proper-url-join'

interface MergeOpenApiPathsOptions {
  pathPrefix: string
}

export const mergeOpenApiPaths = (
  pathObjects: OpenAPIV3_1.PathsObject[],
  options?: MergeOpenApiPathsOptions
) => {
  const mergedObject: OpenAPIV3_1.PathsObject = {}
  pathObjects.forEach((pathObject) => {
    Object.entries(pathObject).forEach(([key, value]) => {
      let path = key
      if (options?.pathPrefix) {
        path = urlJoin(options.pathPrefix, path)
      }
      mergedObject[path] = value
    })
  })
  return mergedObject
}

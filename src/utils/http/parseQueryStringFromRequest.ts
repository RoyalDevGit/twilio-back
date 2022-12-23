import { Request } from 'express'
import queryString, { ParsedQuery } from 'query-string'

export const parseQueryStringFromRequest = <
  T = ParsedQuery<string | boolean | number>
>(
  req: Request
) => {
  const url = new URL(req.url, `${req.protocol}://${req.hostname}`)
  const parsed = queryString.parse(url.search, {
    parseNumbers: true,
    parseBooleans: true,
  })
  return parsed as unknown as Partial<T>
}

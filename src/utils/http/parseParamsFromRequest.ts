import { Request } from 'express'

export const parseParamsFromRequest = <T>(req: Request) =>
  (req.params || {}) as unknown as Partial<T>

/* eslint-disable @typescript-eslint/no-explicit-any */
import { FilterQuery } from 'mongoose'

export const createMongooseRangeQuery = (
  fieldPath: string,
  range: number[]
): FilterQuery<any> => {
  const [rateStart, rateEnd] = range
  const hasStart = Number.isFinite(rateStart)
  const hasEnd = Number.isFinite(rateEnd)
  if (hasStart && hasEnd) {
    return { [fieldPath]: { $gte: rateStart, $lte: rateEnd } }
  }

  if (hasStart) {
    return { [fieldPath]: { $gte: rateStart } }
  }

  return { [fieldPath]: { $lte: rateEnd } }
}

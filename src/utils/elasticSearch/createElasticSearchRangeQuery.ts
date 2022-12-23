export const createElasticSearchRangeQuery = (
  fieldPath: string,
  range: number[]
) => {
  const [rateStart, rateEnd] = range
  const hasStart = Number.isFinite(rateStart)
  const hasEnd = Number.isFinite(rateEnd)
  if (hasStart && hasEnd) {
    return { range: { [fieldPath]: { gte: rateStart, lte: rateEnd } } }
  }

  if (hasStart) {
    return { range: { [fieldPath]: { gte: rateStart } } }
  }

  return { range: { [fieldPath]: { lte: rateEnd } } }
}

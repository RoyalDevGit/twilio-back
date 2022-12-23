import { sortNumbers } from 'utils/array/sortNumbers'

const parseRangePart = (rangePart?: string) => {
  if (!rangePart?.trim()) {
    return Infinity
  }
  return +rangePart
}

const getRangeFromFilter = (rangeString: string) => {
  const rangeParts = rangeString.split('-')
  const start = parseRangePart(rangeParts[0])
  const end = parseRangePart(rangeParts[1])

  const hasStart = Number.isFinite(start)
  const hasEnd = Number.isFinite(end)

  if (hasStart && hasEnd) {
    return [start, end]
  }

  if (hasStart && !hasEnd) {
    return [start, Infinity]
  }

  return [Infinity, end]
}

export const getRangeFromFilterSelections = (selectedRanges: string[]) => {
  if (!selectedRanges.length) {
    return [Infinity, Infinity]
  }

  const starts: number[] = []
  const ends: number[] = []
  selectedRanges.forEach((rangeString) => {
    const [start, end] = getRangeFromFilter(rangeString)
    starts.push(start)
    ends.push(end)
  })
  const sortedStarts = sortNumbers(starts)
  const sortedEnds = sortNumbers(ends).reverse()

  return [sortedStarts[0], sortedEnds[0]]
}

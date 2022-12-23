import { round } from 'mathjs'

import { AverageRating, AverageRatings } from 'models/Comment'

export const calculateAverageRatings = (
  ratingResults: AverageRating[]
): AverageRatings => {
  const averageRatings = {} as AverageRatings
  let overallTotalCount = 0
  ratingResults.forEach((r) => {
    overallTotalCount = overallTotalCount + r.count
  })

  let combinedRating = 0
  ratingResults.forEach((r) => {
    const { count, rating } = r
    const weight = count / overallTotalCount
    const weightedRating = rating * weight
    combinedRating = combinedRating + weightedRating
  })

  averageRatings.overall = {
    rating: round(combinedRating, 2),
    count: overallTotalCount,
  }
  return averageRatings
}

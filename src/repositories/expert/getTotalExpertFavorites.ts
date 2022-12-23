import { Expert } from 'models/Expert'
import { ExpertFavoriteModel } from 'models/ExpertFavorite'

export const getTotalExpertFavorites = async (expert: Expert) => {
  const total = await ExpertFavoriteModel.countDocuments({ expert: expert.id })
  return total
}

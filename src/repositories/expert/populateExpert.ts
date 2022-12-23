import { Expert } from 'models/Expert'
import { ExpertFavoriteModel } from 'models/ExpertFavorite'
import { User } from 'models/User'

export const expertPopulationPaths = [
  {
    path: 'introVideo',
    populate: {
      path: 'thumbnails.file',
    },
  },
  {
    path: 'expertiseCategories',
    populate: {
      path: 'parentCategory',
    },
  },
  {
    path: 'languages',
  },
]

export const populateExpertFavorite = async (
  expert: Expert,
  currentUser: User
) => {
  if (currentUser) {
    const expertFavorite = await ExpertFavoriteModel.findOne({
      expert: expert.id,
      user: currentUser.id,
    })
    expert.isFavorite = !!expertFavorite
  }

  return expert
}

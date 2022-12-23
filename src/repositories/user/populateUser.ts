import { User } from 'models/User'

export const userPopulationPaths = [
  {
    path: 'settings.language',
  },
  {
    path: 'areasOfInterest',
  },
  {
    path: 'profilePicture',
  },
]

export const populateUser = async (user: User) => {
  await user.populate(userPopulationPaths)
  return user
}

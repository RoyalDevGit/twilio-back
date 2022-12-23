import { userPopulationPaths } from 'repositories/user/populateUser'

export const notificationPopulationPaths = [
  {
    path: 'referencedUser',
    populate: userPopulationPaths,
  },
  {
    path: 'targetUser',
    populate: userPopulationPaths,
  },
  {
    path: 'createdBy',
    populate: userPopulationPaths,
  },
]

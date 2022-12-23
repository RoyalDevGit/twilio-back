import { sessionPopulationPaths } from 'repositories/session/populateSession'

export const sessionExtensionRequestPopulationPaths = [
  {
    path: 'session',
    populate: sessionPopulationPaths,
  },
  {
    path: 'requester',
    populate: {
      path: 'profilePicture',
    },
  },
  {
    path: 'replier',
    populate: {
      path: 'profilePicture',
    },
  },
]

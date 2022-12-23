export const commentPopulationPaths = [
  {
    path: 'createdBy',
    populate: {
      path: 'profilePicture',
    },
  },
]

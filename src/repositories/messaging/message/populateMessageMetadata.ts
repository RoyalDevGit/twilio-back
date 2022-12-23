export const messageMetadataPopulationPaths = [
  {
    path: 'attachments',
  },
  {
    path: 'sender',
    populate: {
      path: 'profilePicture',
    },
  },
]

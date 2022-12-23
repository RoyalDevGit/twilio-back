export const sessionPopulationPaths = [
  {
    path: 'recordings',
    populate: {
      path: 'thumbnails.file',
    },
  },
  {
    path: 'consumer',
    populate: {
      path: 'profilePicture',
    },
  },
  {
    path: 'expert',
    populate: [
      { path: 'bannerImage' },
      {
        path: 'user',
        populate: {
          path: 'profilePicture',
        },
      },
    ],
  },
  {
    path: 'order',
  },
  {
    path: 'messagingChannel',
  },
]

export const sessionExpertAndConsumerPopulationPaths = [
  {
    path: 'expert',
    populate: {
      path: 'user',
    },
  },
  {
    path: 'consumer',
  },
]

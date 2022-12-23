export const articlePopulationPaths = [
  {
    path: 'thumbnail',
  },
  {
    path: 'heroImage',
  },
  {
    path: 'category',
    populate: [
      {
        path: 'iconImage',
      },
      {
        path: 'heroImage',
      },
    ],
  },
]

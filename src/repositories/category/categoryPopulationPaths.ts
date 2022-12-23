export const categoryPopulationPaths = [
  {
    path: 'iconImage',
  },
  {
    path: 'heroImage',
  },
  {
    path: 'parentCategory',
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

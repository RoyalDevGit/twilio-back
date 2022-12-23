import { userPopulationPaths } from 'repositories/user/populateUser'

const populationPaths = [
  {
    path: 'paymentMethod',
  },
  {
    path: 'createdBy',
    populate: userPopulationPaths,
  },
]

export const orderPopulationPaths = [
  ...populationPaths,
  {
    path: 'parentOrder',
    populate: populationPaths,
  },
]

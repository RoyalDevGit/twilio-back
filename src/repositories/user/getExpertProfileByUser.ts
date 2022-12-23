import { ExpertModel } from 'models/Expert'
import { User } from 'models/User'
import { expertPopulationPaths } from 'repositories/expert/populateExpert'

export const getExpertProfileByUser = async (user: User) =>
  ExpertModel.findOne({ user: user.id }).populate(expertPopulationPaths)

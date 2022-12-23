import { UserModel } from 'models/User'
import { userPopulationPaths } from 'repositories/user/populateUser'

export const getUserById = async (id: string) => {
  const user = await UserModel.findById(id).populate(userPopulationPaths)
  return user
}

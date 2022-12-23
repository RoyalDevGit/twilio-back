import { UserModel, User } from 'models/User'
import { ApiError } from 'utils/error/ApiError'

export const getSystemAccount = async (): Promise<User> => {
  const systemAccountUser = await UserModel.findOne({ isSystemAccount: true })
  if (!systemAccountUser) {
    throw new ApiError('No System account found')
  }
  return systemAccountUser
}

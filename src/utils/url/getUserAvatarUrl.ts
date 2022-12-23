import { User } from 'models/User'
import { getUserInitialsAvatarUrl } from 'utils/url/getUserInitialsAvatarUrl'
import { getUserProfilePictureUrl } from 'utils/url/getUserProfilePictureUrl'

export const getUserAvatarUrl = async (user: User) => {
  const userProfilePictureUrl = await getUserProfilePictureUrl(user)
  if (userProfilePictureUrl) {
    return userProfilePictureUrl
  }
  return getUserInitialsAvatarUrl(user)
}

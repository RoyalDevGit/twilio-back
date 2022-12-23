import { FileTrackerModel } from 'models/FileTracker'
import { User } from 'models/User'
import { getStorageBucketFileUrl } from 'utils/url/getStorageBucketFileUrl'

export const getUserProfilePictureUrl = async (user: User) => {
  if (user.profilePicture) {
    const userProfilePicture = await FileTrackerModel.findById(
      user.profilePicture
    )
    if (userProfilePicture) {
      return getStorageBucketFileUrl(userProfilePicture.fileKey)
    }
  }
}

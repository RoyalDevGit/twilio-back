import {
  createAppInstanceUser,
  updateAppInstanceUser,
} from 'apis/ChimeMessaging'
import { User } from 'models/User'
import { Env } from 'utils/env'

const AWS_CHIME_APP_INSTANCE_ARN = Env.getString('AWS_CHIME_APP_INSTANCE_ARN')

export const createChimeUserIfNecessary = async (user: User) => {
  if (user.chimeAppInstanceUserArn) {
    /**
     * There are instances where we transfer a database over from another environment.
     * The pre-existing ARN will not be valid so we need to create a new one and attach to the user again.
     */
    if (
      user.chimeAppInstanceUserArn.indexOf(AWS_CHIME_APP_INSTANCE_ARN) !== -1
    ) {
      // if the user is in the correct Chime Instance
      return
    }
  }
  const appInstanceUser = await createAppInstanceUser(
    user.id,
    `${user.firstName} ${user.lastName}`
  )
  user.chimeAppInstanceUserArn = appInstanceUser.AppInstanceUserArn
  await user.save()
}

export const saveStripeCustomer = async (user: User) => {
  if (!user.chimeAppInstanceUserArn) {
    await createChimeUserIfNecessary(user)
    return
  }
  await updateAppInstanceUser(
    user.chimeAppInstanceUserArn,
    `${user.firstName} ${user.lastName}`
  )
}

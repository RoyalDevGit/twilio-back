import { DateTime } from 'luxon'
import { AnyObject } from 'mongoose'

import { UserModel } from 'models/User'
import { hashPassword } from 'utils/auth/password'
import { createChimeUserIfNecessary } from 'utils/messaging/chimeAppInstanceUser'

export const createUser = async (userData: AnyObject) => {
  const newUser = new UserModel({
    ...userData,
    emailVerificationStartDate: DateTime.utc().toJSDate(),
    password: userData.password ? hashPassword(userData.password) : undefined,
    lastSeen: new Date(),
  })

  await newUser.save()

  if (!newUser.isGuest) {
    await createChimeUserIfNecessary(newUser)
  }

  return newUser
}

import { DateTime } from 'luxon'

import { User, UserModel } from 'models/User'

export const updateUserLastSeen = async (user: User) => {
  const lastSeen = DateTime.now().toUTC().toJSDate()
  await UserModel.findByIdAndUpdate(user.id, {
    lastSeen,
  })
  user.lastSeen = lastSeen
}

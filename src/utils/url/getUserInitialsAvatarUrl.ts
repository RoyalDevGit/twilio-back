import * as uiavatars from 'ui-avatars'

import { User } from 'models/User'

export const getUserInitialsAvatarUrl = async (user: User) =>
  uiavatars.generateAvatar({
    uppercase: true,
    name: `${user.firstName} ${user.lastName}`,
    background: '0fa8e3',
    color: '000000',
    fontsize: 0.4,
    bold: true,
    length: 2,
    rounded: true,
    size: 250,
  })

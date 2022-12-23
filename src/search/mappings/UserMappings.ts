import {
  DefaultBooleanField,
  DefaultDateField,
  DefaultTextField,
} from 'search/mappings/common'
import { FileTrackerMappings } from 'search/mappings/FileTrackerMappings'

const UserSettingsMappings = {
  dynamic: true,
  properties: {
    timeZone: DefaultTextField,
  },
}

export const UserMappings = {
  dynamic: true,
  properties: {
    chimeAppInstanceUserArn: DefaultTextField,
    createdAt: DefaultDateField,
    emailAddress: DefaultTextField,
    emailVerificationStartDate: DefaultDateField,
    emailVerified: DefaultBooleanField,
    firstName: DefaultTextField,
    id: DefaultTextField,
    isGuest: DefaultBooleanField,
    joined: DefaultDateField,
    lastName: DefaultTextField,
    lastSeen: DefaultDateField,
    profilePicture: FileTrackerMappings,
    roles: DefaultTextField,
    settings: UserSettingsMappings,
    status: DefaultTextField,
    updatedAt: DefaultDateField,
  },
}

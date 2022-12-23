import {
  DefaultDateField,
  DefaultLongField,
  DefaultTextField,
} from 'search/mappings/common'

export const FileTrackerMappings = {
  dynamic: true,
  properties: {
    id: DefaultTextField,
    originalFileName: DefaultTextField,
    fileKey: DefaultTextField,
    extension: DefaultTextField,
    mimeType: DefaultTextField,
    bucket: DefaultTextField,
    size: DefaultLongField,
    status: DefaultTextField,
    createdBy: DefaultTextField,
    updatedAt: DefaultDateField,
    createdAt: DefaultDateField,
    deactivatedAt: DefaultDateField,
  },
}

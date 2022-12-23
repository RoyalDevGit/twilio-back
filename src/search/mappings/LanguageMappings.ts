import { DefaultTextField } from 'search/mappings/common'
import { FileTrackerMappings } from 'search/mappings/FileTrackerMappings'

export const LanguageMappings = {
  dynamic: true,
  properties: {
    id: DefaultTextField,
    code: DefaultTextField,
    name: DefaultTextField,
    invertedName: DefaultTextField,
    status: DefaultTextField,
    iconImage: FileTrackerMappings,
  },
}

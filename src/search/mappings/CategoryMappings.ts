import { DefaultTextField } from 'search/mappings/common'
import { FileTrackerMappings } from 'search/mappings/FileTrackerMappings'

const categoryProperties = {
  code: DefaultTextField,
  description: DefaultTextField,
  id: DefaultTextField,
  title: DefaultTextField,
  iconImage: FileTrackerMappings,
  heroImage: FileTrackerMappings,
  status: DefaultTextField,
}

export const CategoryMappings = {
  dynamic: true,
  properties: {
    ...categoryProperties,
    parentCategory: {
      dynamic: true,
      properties: categoryProperties,
    },
  },
}

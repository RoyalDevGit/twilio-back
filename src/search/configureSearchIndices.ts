import { createArticleIndex } from 'search/articleIndex'
import { createExpertndex } from 'search/expertIndex'
import { createLanguageIndex } from 'search/languageIndex'
import { createSubcategoryIndex } from 'search/subcategoryIndex'

export const configureSearchIndices = async () => {
  await createLanguageIndex()
  await createSubcategoryIndex()
  await createExpertndex()
  await createArticleIndex()
}

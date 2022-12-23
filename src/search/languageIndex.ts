import { PaginateResult } from 'mongoose'

import { QueryRequest } from 'interfaces/Query'
import { SearchResult } from 'interfaces/Search'
import { Language, LanguageModel, LanguageStatus } from 'models/Language'
import { languagePopulationPaths } from 'repositories/language/languagePopulationPaths'
import { openSearchClient } from 'search'
import { getMaxPaginationLimit } from 'utils/pagination/getMaxPaginationLimit'

export const LANGUAGES_INDEX_NAME = 'languages'

const MAX_PAGINATION_LIMIT = getMaxPaginationLimit()

type LanguageSearchOptions = QueryRequest

export const createLanguageIndex = async () => {
  const { body: exists } = await openSearchClient.indices.exists({
    index: LANGUAGES_INDEX_NAME,
  })
  if (exists) {
    return
  }
  await openSearchClient.indices.create({
    index: LANGUAGES_INDEX_NAME,
    body: {
      mappings: {
        dynamic: true,
        properties: {
          code: { type: 'keyword', normalizer: 'lowercase' },
          name: { type: 'keyword', normalizer: 'lowercase' },
        },
      },
    },
  })
}

export const deleteLanguageIndex = async () => {
  const { body: exists } = await openSearchClient.indices.exists({
    index: LANGUAGES_INDEX_NAME,
  })
  if (!exists) {
    return
  }
  await openSearchClient.indices.delete({
    index: LANGUAGES_INDEX_NAME,
  })
}

export const reindexLanguages = async () => {
  let nextPage: number | null | undefined = 1

  await deleteLanguageIndex()
  await createLanguageIndex()

  while (nextPage) {
    const languageResult: PaginateResult<Language> =
      await LanguageModel.paginate(
        { status: { $ne: LanguageStatus.Inactive } },
        {
          pagination: true,
          page: nextPage,
          limit: 100,
          populate: languagePopulationPaths,
        }
      )

    for (const language of languageResult.docs) {
      await updateLanguageIndex(language)
    }
    nextPage = languageResult.nextPage
  }
}

export const languageSearch = async (
  searchText: string,
  options: LanguageSearchOptions = { limit: MAX_PAGINATION_LIMIT }
): Promise<SearchResult<Language>> => {
  const { limit } = options
  const query = searchText
    ? {
        bool: {
          must: [
            {
              multi_match: {
                type: 'bool_prefix',
                query: searchText,
                fields: ['code', 'name'],
              },
            },
          ],
        },
      }
    : {
        match_all: {},
      }

  const req = {
    size: limit,
    query,
    sort: [{ name: 'asc' }, '_score'],
  }

  const response = await openSearchClient.search({
    index: LANGUAGES_INDEX_NAME,
    body: req,
  })

  const { body } = response
  const hitsObject = body.hits
  const { hits, total } = hitsObject
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docs = hits.map((hit: any) => hit._source)

  return {
    total: total.value,
    took: body.took,
    timedOut: body.timed_out,
    items: docs,
    hasPrevPage: false,
    hasNextPage: false,
    pagingCounter: 0,
  }
}

export const updateLanguageIndex = async (language: Language) => {
  const response = await openSearchClient.index({
    id: language.id,
    index: LANGUAGES_INDEX_NAME,
    body: language,
    refresh: true,
  })

  return response
}

export const removeFromLanguageIndex = async (language: Language) => {
  const response = await openSearchClient.delete({
    id: language.id,
    index: LANGUAGES_INDEX_NAME,
  })

  return response
}

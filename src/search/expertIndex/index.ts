import { PaginateResult } from 'mongoose'

import { SearchResult } from 'interfaces/Search'
import { Expert, ExpertModel } from 'models/Expert'
import { expertPopulationPaths } from 'repositories/expert/populateExpert'
import { openSearchClient } from 'search'
import { ExpertMappings, IndexedExpert } from 'search/mappings/ExpertMappings'
import { toPlainObject } from 'utils/object/toPlainObject'
import { AvailabilityOptionModel } from 'models/AvailabilityOption'
import { SessionDurationOptionModel } from 'models/SessionDurationOption'
import { UserStatus } from 'models/User'
import { QueryExpertFilters } from 'repositories/expert/queryExperts'
import { applyFiltersToElasticSearchQuery } from 'utils/filters/applyFiltersToElasticSearchQuery'

export const EXPERTS_INDEX_NAME = 'experts'

export const createExpertndex = async () => {
  const { body: exists } = await openSearchClient.indices.exists({
    index: EXPERTS_INDEX_NAME,
  })
  if (exists) {
    return
  }
  await openSearchClient.indices.create({
    index: EXPERTS_INDEX_NAME,
    body: {
      mappings: ExpertMappings,
    },
  })
}

export const deleteExpertIndex = async () => {
  const { body: exists } = await openSearchClient.indices.exists({
    index: EXPERTS_INDEX_NAME,
  })
  if (!exists) {
    return
  }
  await openSearchClient.indices.delete({
    index: EXPERTS_INDEX_NAME,
  })
}

const indexExpertDocument = async (expert: Expert) => {
  const availabilityOptions = await AvailabilityOptionModel.find({
    expert: expert.id,
    enabled: true,
  })

  const hasAvailabilityRanges = availabilityOptions.some(
    (option) => !!option.ranges?.length
  )

  const durationOptions = await SessionDurationOptionModel.find({
    expert: expert.id,
  })

  const hasAvailability = !!(hasAvailabilityRanges && durationOptions.length)

  const expertToIndex: Partial<IndexedExpert> = {
    ...toPlainObject(expert),
    hasAvailability,
  }

  const response = await openSearchClient.index({
    id: expert.id,
    index: EXPERTS_INDEX_NAME,
    body: expertToIndex,
    refresh: true,
  })

  return response
}

export const reindexExperts = async () => {
  let nextPage: number | null | undefined = 1

  await deleteExpertIndex()
  await createExpertndex()
  while (nextPage) {
    const expertResult: PaginateResult<Expert> = await ExpertModel.paginate(
      {},
      {
        pagination: true,
        page: nextPage,
        limit: 100,
        populate: expertPopulationPaths,
        read: { pref: 'primary' },
      }
    )

    for (const expert of expertResult.docs) {
      await indexExpertDocument(expert)
    }
    nextPage = expertResult.nextPage
  }
}

export const updateExpertIndex = async (expertId: string) => {
  const expert = await ExpertModel.findById(expertId, null, {
    readPreference: 'primary',
  }).populate(expertPopulationPaths)

  if (!expert) {
    throw new Error('Expert to index was not found')
  }

  return indexExpertDocument(expert)
}

export const expertSearch = async (
  searchText: string,
  filters: QueryExpertFilters
): Promise<SearchResult<Expert>> => {
  const must: unknown[] = [
    {
      multi_match: {
        type: 'bool_prefix',
        query: searchText,
        fields: [
          'user.firstName^3',
          'user.lastName^2',
          'mainAreaOfExpertise',
          'expertiseCategories.title',
          'expertiseCategories.description',
          'expertiseCategories.parentCategory.title',
          'expertiseCategories.parentCategory.description',
          'experiences',
          'languages.name',
          'location',
          'description.*',
        ],
      },
    },
  ]

  const should: unknown[] = [
    {
      match: {
        'user.status': UserStatus.Available,
      },
    },
    {
      match: {
        hasAvailability: true,
      },
    },
    {
      match: {
        verified: true,
      },
    },
    { range: { total_spend: { gte: 0 } } },
  ]

  applyFiltersToElasticSearchQuery(must, filters)

  const req = {
    query: {
      bool: {
        must,
        should,
      },
    },
  }

  const response = await openSearchClient.search({
    index: EXPERTS_INDEX_NAME,
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

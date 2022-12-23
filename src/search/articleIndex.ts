import { QueryResponse } from 'interfaces/Query'
import { SearchResult } from 'interfaces/Search'
import { Article } from 'models/Article'
import { queryArticles } from 'repositories/articles/queryArticles'
import { openSearchClient } from 'search'

export const ARTICLES_INDEX_NAME = 'articles'

export const createArticleIndex = async () => {
  const { body: exists } = await openSearchClient.indices.exists({
    index: ARTICLES_INDEX_NAME,
  })
  if (exists) {
    return
  }

  await openSearchClient.indices.create({
    index: ARTICLES_INDEX_NAME,
    body: {
      mappings: {
        dynamic: true,
        properties: {
          title: { type: 'keyword', normalizer: 'lowercase' },
          code: { type: 'keyword', normalizer: 'lowercase' },
        },
      },
    },
  })
}

export const deleteArticleIndex = async () => {
  const { body: exists } = await openSearchClient.indices.exists({
    index: ARTICLES_INDEX_NAME,
  })
  if (!exists) {
    return
  }

  await openSearchClient.indices.delete({
    index: ARTICLES_INDEX_NAME,
  })
}

export const reindexArticles = async () => {
  let nextPage: number | null | undefined = 1

  await deleteArticleIndex()
  await createArticleIndex()
  while (nextPage) {
    const articleResults: QueryResponse<Article> = await queryArticles({
      only: 'categories',
      queryRequest: {
        page: nextPage,
        limit: 100,
      },
    })
    for (const article of articleResults.items) {
      await updateArticleIndex(article)
    }
    nextPage = articleResults.nextPage
  }
}

export const articleSearch = async (
  searchText: string
): Promise<SearchResult<Article>> => {
  const query = searchText
    ? {
        bool: {
          must: [
            {
              multi_match: {
                type: 'bool_prefix',
                query: searchText,
                fields: ['title^4', 'body', 'article.title^2'],
              },
            },
          ],
        },
      }
    : {
        match_all: {},
      }

  const req = {
    query,
    sort: [{ title: 'asc' }, '_score'],
  }

  const response = await openSearchClient.search({
    index: ARTICLES_INDEX_NAME,
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

export const updateArticleIndex = async (article: Article) => {
  const response = await openSearchClient.index({
    id: article.id,
    index: ARTICLES_INDEX_NAME,
    body: article,
    refresh: true,
  })

  return response
}

export const removeFromArticleIndex = async (article: Article) => {
  const response = await openSearchClient.delete({
    id: article.id,
    index: ARTICLES_INDEX_NAME,
  })

  return response
}

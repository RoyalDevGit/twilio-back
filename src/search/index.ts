import { Client } from '@opensearch-project/opensearch'

import { Env } from 'utils/env'

const OPEN_SEARCH_PROTOCOL = Env.getString('OPEN_SEARCH_PROTOCOL')
const OPEN_SEARCH_HOST = Env.getString('OPEN_SEARCH_HOST')
const OPEN_SEARCH_PORT = Env.getNumber('OPEN_SEARCH_PORT')
const OPEN_SEARCH_USERNAME = Env.getString('OPEN_SEARCH_USERNAME')
const OPEN_SEARCH_PASSWORD = Env.getString('OPEN_SEARCH_PASSWORD')
const OPEN_SEARCH_VALIDATE_SSL = Env.getBoolean('OPEN_SEARCH_VALIDATE_SSL')

export const openSearchClient = new Client({
  node: `${OPEN_SEARCH_PROTOCOL}://${OPEN_SEARCH_USERNAME}:${OPEN_SEARCH_PASSWORD}@${OPEN_SEARCH_HOST}:${OPEN_SEARCH_PORT}`,
  ssl: {
    rejectUnauthorized: OPEN_SEARCH_VALIDATE_SSL,
  },
})

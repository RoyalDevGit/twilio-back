import urlJoin from 'proper-url-join'

import { Env } from 'utils/env'

const CONTENT_FILES_URL = Env.getString('CONTENT_FILES_URL')

export const getStorageBucketFileUrl = (fileKey: string) =>
  urlJoin(CONTENT_FILES_URL, fileKey)

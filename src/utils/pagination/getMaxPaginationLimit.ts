import { Env } from 'utils/env'

const MAX_PAGINATION_ITEMS = Env.getNumber('MAX_PAGINATION_ITEMS')

export const getMaxPaginationLimit = () => MAX_PAGINATION_ITEMS || 100

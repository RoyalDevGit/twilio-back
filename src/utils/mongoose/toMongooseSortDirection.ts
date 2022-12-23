export const toMongooseSortDirection = (
  sortDirection: 'asc' | 'desc' | undefined | null
) => (sortDirection === 'desc' ? -1 : 1)

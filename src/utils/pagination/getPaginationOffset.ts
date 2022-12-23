export const getPaginationOffset = (page: number, limit: number) =>
  (page - 1) * limit

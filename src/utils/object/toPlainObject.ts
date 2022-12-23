export const toPlainObject = <T>(doc: T) => JSON.parse(JSON.stringify(doc)) as T

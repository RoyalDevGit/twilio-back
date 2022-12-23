const REGEXP = /^[0-9]+$/

const getEntities = <V extends string | number>(
  object: Record<string, string | number>,
  converter: (name: string) => V
): Array<V> => {
  const result = new Array<V>()
  for (const name in object) {
    if (!REGEXP.test(name)) {
      result.push(converter(name))
    }
  }
  return result
}

export const getEnumNames = (
  object: Record<string, string | number>
): Array<string> => getEntities(object, (name) => name)

export const getEnumValues = (
  object: Record<string, string | number>
): Array<string | number> => getEntities(object, (name) => object[name])

export const paramValueAsArray = (
  value: string | number | boolean | string[] | number[] | boolean[]
): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => item.toString())
  }
  return [value.toString()]
}

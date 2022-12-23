export const sortNumbers = (numbers: number[]) => [
  ...new Float64Array(numbers).sort(),
]

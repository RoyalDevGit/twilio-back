import { round } from 'mathjs'

export const convertPriceToCents = (price: number) => round(price * 100, 2)

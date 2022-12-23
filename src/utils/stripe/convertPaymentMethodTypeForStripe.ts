import { PaymentMethodType } from 'models/PaymentMethod'

export const convertPaymentMethodTypeForStripe = (type: PaymentMethodType) => {
  switch (type) {
    case PaymentMethodType.CreditCard:
      return ['card']
    default:
      throw new Error('Invalid PaymentMethodType')
  }
}

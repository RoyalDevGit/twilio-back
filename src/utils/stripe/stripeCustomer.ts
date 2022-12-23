import { stripe } from 'apis/Stripe'
import { User, UserModel } from 'models/User'
import { joinPhoneNumber } from 'utils/string/joinPhoneNumber'

export const createStripeCustomerIfNecessary = async (user: User) => {
  if (user.stripeId) {
    return
  }
  const customer = await stripe.customers.create({
    name: `${user.firstName} ${user.lastName}`,
    email: user.emailAddress,
    phone: user.mobilePhoneNumber
      ? joinPhoneNumber(user.mobilePhoneNumber)
      : undefined,
    metadata: {
      expertSessionUserId: user.id,
    },
  })
  user.stripeId = customer.id
  await UserModel.findByIdAndUpdate(user.id, {
    stripeId: customer.id,
  })
}

export const saveStripeCustomer = async (user: User) => {
  if (!user.stripeId) {
    await createStripeCustomerIfNecessary(user)
    return
  }
  await stripe.customers.update(user.stripeId, {
    name: `${user.firstName} ${user.lastName}`,
    email: user.emailAddress,
    phone: user.mobilePhoneNumber
      ? joinPhoneNumber(user.mobilePhoneNumber)
      : undefined,
  })
}

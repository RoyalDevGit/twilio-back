import { ExpertModel } from 'models/Expert'
import { ExpertFavoriteModel } from 'models/ExpertFavorite'
import {
  OrderItem,
  OrderItemType,
  OrderModel,
  SessionOrderItem,
} from 'models/Order'
import { User } from 'models/User'
import { getTotalExpertFavorites } from 'repositories/expert/getTotalExpertFavorites'
import { getCurrentOrderByUser } from 'repositories/order/getCurrentOrderByUser'
import { createStripeCustomerIfNecessary } from 'utils/stripe/stripeCustomer'

const transferOrder = async (guestUser: User, user: User) => {
  await createStripeCustomerIfNecessary(user)
  const guestUserOrder = await getCurrentOrderByUser(guestUser)
  const userOrder = await getCurrentOrderByUser(user)

  if (!guestUserOrder) {
    return
  }
  if (userOrder) {
    await userOrder.delete()
  }

  const newItems = guestUserOrder.items.map((item) => {
    if (item.itemType === OrderItemType.Session) {
      const sessionOrderItem = item as OrderItem<SessionOrderItem>
      sessionOrderItem.data.consumer = user.id
    }
    return item
  })

  await OrderModel.findByIdAndUpdate(
    guestUserOrder.id,
    {
      $unset: { paymentMethod: 1, stripeOrderId: 1 },
      createdBy: user,
      items: newItems,
    },
    {
      runValidators: true,
    }
  )
}

const transferFavorites = async (guestUser: User, user: User) => {
  const guestFavorites = await ExpertFavoriteModel.find({ user: guestUser.id })
  for (let i = 0; i < guestFavorites.length; i++) {
    const guestFavorite = guestFavorites[i]
    const existingFavorite = await ExpertFavoriteModel.findOne({
      user: user.id,
      expert: guestFavorite.expert,
    })
    if (existingFavorite) {
      await guestFavorite.delete()
      continue
    }
    await ExpertFavoriteModel.findByIdAndUpdate(guestFavorite.id, {
      user: user.id,
      createdBy: user.id,
    })

    const expert = await ExpertModel.findById(guestFavorite.expert)
    if (!expert) {
      continue
    }
    const totalFavorites = await getTotalExpertFavorites(expert)
    await ExpertModel.findByIdAndUpdate(expert.id, {
      totalFavorites,
    })
  }
}

export const transferGuestUserResourcesAndDelete = async (
  guestUser: User,
  user: User
) => {
  await transferOrder(guestUser, user)
  await transferFavorites(guestUser, user)
  await guestUser.delete()
}

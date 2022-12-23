import { OrderPaymentStatus, OrderRefundStatus } from 'models/Order'
import { ApiError } from 'utils/error/ApiError'
import { Session } from 'models/Session'
import { releaseOrderFunds } from 'commerceOperations/releaseOrderFunds'

export const cancelSessionWithFullRefund = async (session: Session) => {
  if (!session.order) {
    throw new ApiError('Session order must be populated')
  }

  const { order } = session

  if (order.paymentStatus === OrderPaymentStatus.Authorized) {
    await releaseOrderFunds(order)
  }

  order.refundStatus = OrderRefundStatus.FullRefundCompleted
  await order.save()
}

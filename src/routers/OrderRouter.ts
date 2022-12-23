import express, { Request, Response, NextFunction } from 'express'
import { DateTime } from 'luxon'
import Ajv from 'ajv'

import { requireAuthenticationMiddlewares } from 'middleware/authMiddleware'
import { AuthenticatedRequest } from 'interfaces/Express'
import {
  Order,
  OrderModel,
  OrderPaymentStatus,
  OrderRefundStatus,
  OrderStatus,
} from 'models/Order'
import { ApiError, ApiErrorCode } from 'utils/error/ApiError'
import { parseQueryStringFromRequest } from 'utils/http/parseQueryStringFromRequest'
import { parseParamsFromRequest } from 'utils/http/parseParamsFromRequest'
import { parsePaginationParams } from 'utils/pagination/parsePaginationParams'
import { processOrder } from 'repositories/order/processOrder'
import { getOrderById } from 'repositories/order/getOrderById'
import { OrdersQueryOnly, queryOrders } from 'repositories/order/queryOrders'
import { SessionStatus } from 'models/Session'
import { getCurrentOrderByUser } from 'repositories/order/getCurrentOrderByUser'
import { RefundRequest, RefundRequestModel } from 'models/RefundRequest'
import { createOrder, PartialOrderData } from 'repositories/order/createOrder'
import { updateOrder } from 'repositories/order/updateOrder'
import { PaymentMethodModel } from 'models/PaymentMethod'
import { stripe } from 'apis/Stripe'

export const orderRouterPathPrefix = '/orders'
export const OrderRouter = express.Router()

OrderRouter.get('/current', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user } = appReq
    try {
      const order = await getCurrentOrderByUser(user)

      if (!order) {
        res.sendStatus(204)
        return
      }

      const populatedOrder = await getOrderById(order.id, {
        readPreference: 'primary',
      })
      res.status(200).json(populatedOrder)
    } catch (e) {
      next(e)
    }
  },
])

OrderRouter.post('/', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { body } = appReq
    const orderData = (body || {}) as PartialOrderData

    try {
      const newOrder = await createOrder({ req, orderData })
      res.status(201).json(newOrder)
    } catch (e) {
      next(e)
    }
  },
])

interface GetOrderByIdParams {
  orderId: string
}

OrderRouter.patch('/:orderId', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { body } = appReq
    const updateData = body as Order
    const { orderId } = parseParamsFromRequest<GetOrderByIdParams>(req)
    try {
      const order = await OrderModel.findById(orderId)

      if (!order) {
        throw new ApiError('orderNotFound', ApiErrorCode.NotFound)
      }

      if (order.status !== OrderStatus.Open) {
        throw new ApiError('onlyOpenOrdersCanBeUpdated', ApiErrorCode.Forbidden)
      }

      const updatedOrder = await updateOrder({
        orderId: order.id,
        updateData,
      })
      res.status(200).json(updatedOrder)
    } catch (e) {
      next(e)
    }
  },
])

OrderRouter.post('/:orderId/process', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appReq = req as AuthenticatedRequest
      const { user } = appReq
      const { orderId } = parseParamsFromRequest<GetOrderByIdParams>(req)
      const order = await getOrderById(orderId as string)

      if (!order) {
        throw new ApiError('orderNotFound', ApiErrorCode.NotFound)
      }

      await processOrder(order, user)

      const populatedOrder = await getOrderById(order.id)
      res.status(200).json(populatedOrder)
    } catch (e) {
      next(e)
    }
  },
])

interface UpdateFailedPaymentBody {
  paymentMethodId: string
}

const UpdateFailedPaymentBodySchema = {
  type: 'object',
  properties: {
    paymentMethodId: { type: 'string' },
  },
  required: ['paymentMethodId'],
  additionalProperties: false,
}

OrderRouter.patch('/:orderId/update-failed-payment', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ajv = new Ajv()
      const appReq = req as AuthenticatedRequest
      const { orderId } = parseParamsFromRequest<GetOrderByIdParams>(req)
      const paymentData = appReq.body as UpdateFailedPaymentBody

      ajv.validate(UpdateFailedPaymentBodySchema, paymentData)

      if (ajv.errors?.length) {
        throw ApiError.fromSchemaValidationErrors(ajv.errors)
      }

      const { paymentMethodId } = paymentData

      const order = await OrderModel.findById(orderId)

      if (!order) {
        throw new ApiError('orderNotFound', ApiErrorCode.NotFound)
      }

      const paymentMethod = await PaymentMethodModel.findById(paymentMethodId)

      if (!paymentMethod) {
        throw new ApiError('paymentMethodNotFound', ApiErrorCode.NotFound)
      }

      if (order.status !== OrderStatus.Complete) {
        throw new ApiError(
          'onlyOrdersWithCompleteStatusCanBeUpdated',
          ApiErrorCode.Forbidden
        )
      }

      if (order.paymentStatus !== OrderPaymentStatus.FailedAuthorization) {
        throw new ApiError(
          'onlyOrdersWithFailedAuthorizationStatusCanBeUpdated',
          ApiErrorCode.Forbidden
        )
      }

      const stripeOrder = await stripe.orders.retrieve(
        order.stripeOrderId as string
      )

      const orderPaymentIntentId = stripeOrder.payment.payment_intent as string

      await stripe.paymentIntents.confirm(orderPaymentIntentId, {
        payment_method: paymentMethod.stripePaymentMethodId as string,
      })

      await OrderModel.findByIdAndUpdate(order.id, {
        paymentMethod: paymentMethod.id,
        paymentStatus: OrderPaymentStatus.Authorized,
        $unset: { paymentFailureDate: 1 },
      })

      const populatedOrder = await getOrderById(order.id, {
        readPreference: 'primary',
      })
      res.status(200).json(populatedOrder)
    } catch (e) {
      next(e)
    }
  },
])

OrderRouter.get('/:orderId', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { orderId } = parseParamsFromRequest<GetOrderByIdParams>(req)
    try {
      const order = await getOrderById(orderId as string)

      if (!order) {
        throw new ApiError('orderNotFound', ApiErrorCode.NotFound)
      }

      res.status(200).json(order)
    } catch (e) {
      next(e)
    }
  },
])

interface OrderQueryParams {
  status?: OrderStatus[] | OrderStatus
  sessionStatus?: SessionStatus[] | SessionStatus
  from?: string
  to?: string
  only?: OrdersQueryOnly
  sessionStart?: string
  sessionEnd?: string
}

OrderRouter.get('/', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, query } = appReq
    const paginationRequest = parsePaginationParams(query)
    const { status, sessionStatus, from, to, only, sessionStart, sessionEnd } =
      parseQueryStringFromRequest<OrderQueryParams>(appReq)

    try {
      if (!from || !to) {
        throw new ApiError('invalidDateRange', ApiErrorCode.BadRequest)
      }
      const fromDate = DateTime.fromISO(from).toUTC()
      const toDate = DateTime.fromISO(to).toUTC()
      const queryResponse = await queryOrders({
        ...paginationRequest,
        createdBy: user.id,
        status,
        from: fromDate,
        to: toDate,
        sessionStatus,
        sessionStart,
        sessionEnd,
        only,
      })

      res.status(200).json(queryResponse)
    } catch (e) {
      next(e)
    }
  },
])

OrderRouter.post('/:orderId/request-refund', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { body } = appReq
    const { orderId } = parseParamsFromRequest<GetOrderByIdParams>(req)
    const newRequestData = body as RefundRequest
    try {
      const order = await OrderModel.findById(orderId)

      if (!order) {
        throw new ApiError('orderNotFound', ApiErrorCode.NotFound)
      }

      if (order.status !== OrderStatus.Complete) {
        throw new ApiError(
          'onlyCompleteOrdersCanBeRefunded',
          ApiErrorCode.Forbidden
        )
      }

      const newRefundRequest = new RefundRequestModel({
        order: order.id,
        description: newRequestData.description,
      })

      await newRefundRequest.save()

      await OrderModel.findByIdAndUpdate(order.id, {
        status: OrderRefundStatus.RefundRequested,
      })

      const populatedOrder = await getOrderById(order.id)
      res.status(200).json(populatedOrder)
    } catch (e) {
      next(e)
    }
  },
])

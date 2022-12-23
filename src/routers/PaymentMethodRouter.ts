import express, { Request, Response, NextFunction } from 'express'
import { FilterQuery } from 'mongoose'
import Stripe from 'stripe'

import { requireAuthenticationMiddlewares } from 'middleware/authMiddleware'
import { AuthenticatedRequest } from 'interfaces/Express'
import { stripe } from 'apis/Stripe'
import {
  PaymentMethod,
  PaymentMethodModel,
  PaymentMethodStatus,
  PaymentMethodType,
} from 'models/PaymentMethod'
import { parseParamsFromRequest } from 'utils/http/parseParamsFromRequest'
import { ApiError, ApiErrorCode } from 'utils/error/ApiError'
import { parseQueryStringFromRequest } from 'utils/http/parseQueryStringFromRequest'
import { paramValueAsArray } from 'utils/http/paramValueAsArray'
import { parsePaginationParams } from 'utils/pagination/parsePaginationParams'
import { toQueryResponse } from 'utils/pagination/toQueryResponse'
import { createStripeCustomerIfNecessary } from 'utils/stripe/stripeCustomer'
import { convertPaymentMethodTypeForStripe } from 'utils/stripe/convertPaymentMethodTypeForStripe'
import { applyStripePaymentMethodDetails } from 'utils/stripe/applyStripePaymentMethodDetails'

export const paymentMethodRouterPathPrefix = '/payment-methods'
export const PaymentMethodRouter = express.Router()

PaymentMethodRouter.post('/', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user, body } = appReq
    const paymentMethodData = body as PaymentMethod
    try {
      await createStripeCustomerIfNecessary(user)

      const newPaymentMethod = new PaymentMethodModel({
        ...paymentMethodData,
        createdBy: user.id,
      })

      const setupIntent = await stripe.setupIntents.create({
        customer: user.stripeId,
        payment_method_types: convertPaymentMethodTypeForStripe(
          newPaymentMethod.paymentMethodType
        ),
        usage: 'off_session',
        metadata: {
          expertPaymentMethodId: newPaymentMethod.id,
        },
      })

      newPaymentMethod.stripeSetupIntentId = setupIntent.id
      newPaymentMethod.stripeSetupIntentClientSecret = setupIntent.client_secret

      await newPaymentMethod.save()

      res.status(201).json(newPaymentMethod)
    } catch (e) {
      next(e)
    }
  },
])

interface GetPaymentMethodByIdParams {
  paymentMethodId: string
}

PaymentMethodRouter.patch('/:paymentMethodId', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { body, user } = appReq
    const updateData = body as PaymentMethod
    const { paymentMethodId } =
      parseParamsFromRequest<GetPaymentMethodByIdParams>(req)
    try {
      const paymentMethod = await PaymentMethodModel.findById(paymentMethodId)

      if (!paymentMethod) {
        throw new ApiError('paymentMethodNotFound', ApiErrorCode.NotFound)
      }

      const updatedPaymentMethod = await PaymentMethodModel.findByIdAndUpdate(
        paymentMethod.id,
        updateData,
        { runValidators: true, new: true }
      )

      if (!updatedPaymentMethod) {
        throw new ApiError('paymentMethodNotFound', ApiErrorCode.NotFound)
      }

      const setupIntent = await stripe.setupIntents.update(
        updatedPaymentMethod.stripeSetupIntentId
      )
        console.log(setupIntent)
      updatedPaymentMethod.stripeSetupIntentClientSecret =
        setupIntent.client_secret

      await applyStripePaymentMethodDetails(updatedPaymentMethod)
      updatedPaymentMethod.save()

      // if this payment method was marked as preferred
      // unmark all the other ones
      if (updatedPaymentMethod.preferred) {
        await PaymentMethodModel.updateMany(
          {
            user: user.id,
            _id: {
              $ne: updatedPaymentMethod.id,
            },
          },
          {
            preferred: false,
          }
        )
      }

      res.status(200).json(updatedPaymentMethod)
    } catch (e) {
      next(e)
    }
  },
])

PaymentMethodRouter.put('/:paymentMethodId', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { body, user } = appReq
    const updateData = body as PaymentMethod
    const { paymentMethodId } =
      parseParamsFromRequest<GetPaymentMethodByIdParams>(req)
    try {
      const paymentMethod = await PaymentMethodModel.findById(paymentMethodId)

      if (!paymentMethod) {
        throw new ApiError('paymentMethodNotFound', ApiErrorCode.NotFound)
      }

      const updatedPaymentMethod = await PaymentMethodModel.findByIdAndUpdate(
        paymentMethod.id,
        updateData,
        { runValidators: true, new: true }
      )

      if (!updatedPaymentMethod) {
        throw new ApiError('paymentMethodNotFound', ApiErrorCode.NotFound)
      }

      const setupIntent = await stripe.setupIntents.update(
        "seti_1MHAcBKq0PhFh4nt6BybnnEC"
      )


      // if this payment method was marked as preferred
      // unmark all the other ones
      

      res.status(200).json({setupIntent})
    } catch (e) {
      next(e)
    }
  },
])

PaymentMethodRouter.get('/:paymentMethodId', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { paymentMethodId } =
      parseParamsFromRequest<GetPaymentMethodByIdParams>(appReq)
    try {
      const paymentMethod = await PaymentMethodModel.findById(paymentMethodId)

      if (!paymentMethod) {
        throw new ApiError('paymentMethodNotFound', ApiErrorCode.NotFound)
      }

      res.status(200).json(paymentMethod)
    } catch (e) {
      next(e)
    }
  },
])

interface PaymentMethodQueryParams {
  status?: PaymentMethodStatus | PaymentMethodStatus[]
}

PaymentMethodRouter.get('/', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user } = appReq
    const paginationRequest = parsePaginationParams(req.query)
    const { status } =
      parseQueryStringFromRequest<PaymentMethodQueryParams>(appReq)
    try {
      const query: FilterQuery<PaymentMethod> = {
        createdBy: user.id,
        status: {
          $ne: PaymentMethodStatus.Deleted,
        },
      }
      if (status) {
        query.status = {
          $in: paramValueAsArray(status),
        }
      }
      const paymentMethodPagination = await PaymentMethodModel.paginate(query, {
        ...paginationRequest,
        sort: {
          createdAt: 1,
        },
      })

      res.status(200).json(toQueryResponse(paymentMethodPagination))
    } catch (e) {
      next(e)
    }
  },
])

PaymentMethodRouter.delete('/:paymentMethodId', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { paymentMethodId } =
      parseParamsFromRequest<GetPaymentMethodByIdParams>(appReq)
    try {
      const paymentMethod = await PaymentMethodModel.findById(paymentMethodId)

      if (!paymentMethod) {
        throw new ApiError('paymentMethodNotFound', ApiErrorCode.NotFound)
      }

      if (paymentMethod.stripePaymentMethodId) {
        await stripe.paymentMethods.detach(paymentMethod.stripePaymentMethodId)
      }

      await paymentMethod.update({
        status: PaymentMethodStatus.Deleted,
      })

      res.status(204).json(paymentMethod)
    } catch (e) {
      next(e)
    }
  },
])

PaymentMethodRouter.post('/sync', [
  ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user } = appReq
    try {
      const newPaymentMethods: PaymentMethod[] = []
      await createStripeCustomerIfNecessary(user)
      const allStripePaymentMethods: Stripe.PaymentMethod[] = []
      let stripePaymentMethodsResult = await stripe.paymentMethods.list({
        type: 'card',
        customer: user.stripeId,
        limit: 100,
      })
      allStripePaymentMethods.push(...stripePaymentMethodsResult.data)

      while (stripePaymentMethodsResult.has_more) {
        stripePaymentMethodsResult = await stripe.paymentMethods.list({
          type: 'card',
          customer: user.stripeId,
          limit: 100,
          starting_after: stripePaymentMethodsResult.data.at(-1)?.id,
        })
        allStripePaymentMethods.push(...stripePaymentMethodsResult.data)
      }

      const userPaymentMethods = await PaymentMethodModel.find({
        createdBy: user.id,
        stripePaymentMethodId: { $ne: null },
      })

      allStripePaymentMethods.forEach((stripePaymentMethod) => {
        const paymentMethod = userPaymentMethods.find(
          (pm) => pm.stripePaymentMethodId === stripePaymentMethod.id
        )
        if (paymentMethod) {
          return
        }
        const newPaymentMethod = new PaymentMethodModel({
          paymentMethodType: PaymentMethodType.CreditCard,
          status: PaymentMethodStatus.Ready,
          createdBy: user.id,
        })
        applyStripePaymentMethodDetails(newPaymentMethod, stripePaymentMethod)
        newPaymentMethods.push(newPaymentMethod)
      })

      await PaymentMethodModel.insertMany(newPaymentMethods)

      res.sendStatus(204)
    } catch (e) {
      next(e)
    }
  },
])

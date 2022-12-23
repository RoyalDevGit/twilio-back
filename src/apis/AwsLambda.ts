import Lambda, { InvocationRequest } from 'aws-sdk/clients/lambda'

import { Env } from 'utils/env'
import { ApiError, ApiErrorCode } from 'utils/error/ApiError'

const AWS_REGION = Env.getString('AWS_REGION')
const AWS_ACCESS_KEY_ID = Env.getString('AWS_ACCESS_KEY_ID')
const AWS_SECRET_ACCESS_KEY = Env.getString('AWS_SECRET_ACCESS_KEY')

const lambdaClient = new Lambda({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
})

interface LambdaError {
  errorType: string
  errorMessage: string
}

export const invokeLambda = async <T>(invocationRequest: InvocationRequest) => {
  const res = await lambdaClient.invoke(invocationRequest).promise()
  if (res.FunctionError) {
    const executionError = JSON.parse(res.Payload as string) as LambdaError
    throw new ApiError(executionError.errorMessage, ApiErrorCode.Unknown)
  }
  return JSON.parse(res.Payload as string) as T
}

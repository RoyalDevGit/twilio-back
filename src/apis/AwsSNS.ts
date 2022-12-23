import AWS from 'aws-sdk'

import { Env } from 'utils/env'

const AWS_REGION = Env.getString('AWS_REGION')
const AWS_ACCESS_KEY_ID = Env.getString('AWS_ACCESS_KEY_ID')
const AWS_SECRET_ACCESS_KEY = Env.getString('AWS_SECRET_ACCESS_KEY')

const snsClient = new AWS.SNS({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
})

export const sendSMS = async (
  phoneNumber: string,
  message: string
): Promise<void> =>
  new Promise((resolve, reject) => {
    const params = {
      PhoneNumber: phoneNumber,
      Message: message,
    }

    snsClient.publish(params, function (err) {
      if (err) {
        reject(err)
        return
      }
      resolve()
    })
  })

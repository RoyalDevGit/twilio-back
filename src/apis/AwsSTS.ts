import {
  STSClient,
  AssumeRoleCommand,
  AssumeRoleCommandInput,
} from '@aws-sdk/client-sts'

import { Env } from 'utils/env'

const AWS_REGION = Env.getString('AWS_REGION')
const AWS_ACCESS_KEY_ID = Env.getString('AWS_ACCESS_KEY_ID')
const AWS_SECRET_ACCESS_KEY = Env.getString('AWS_SECRET_ACCESS_KEY')

const stsClient = new STSClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
})

export const assumeRole = async (params: AssumeRoleCommandInput) => {
  const command = new AssumeRoleCommand(params)
  const res = await stsClient.send(command)
  return res
}

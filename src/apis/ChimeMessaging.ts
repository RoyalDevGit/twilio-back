import AWS from 'aws-sdk'
import { v4 as uuidv4 } from 'uuid'
import ChimeSDKMessaging, {
  CreateChannelMembershipRequest,
  CreateChannelRequest,
  ListChannelMessagesRequest,
  SendChannelMessageRequest,
  UpdateChannelMessageRequest,
} from 'aws-sdk/clients/chimesdkmessaging'

import { Env } from 'utils/env'

const AWS_CHIME_APP_INSTANCE_ARN = Env.getString('AWS_CHIME_APP_INSTANCE_ARN')
const AWS_CHIME_APP_INSTANCE_USER_ARN = Env.getString(
  'AWS_CHIME_APP_INSTANCE_USER_ARN'
)
const AWS_REGION = Env.getString('AWS_REGION')
const AWS_ACCESS_KEY_ID = Env.getString('AWS_ACCESS_KEY_ID')
const AWS_SECRET_ACCESS_KEY = Env.getString('AWS_SECRET_ACCESS_KEY')

const chimeIdentity = new AWS.ChimeSDKIdentity({
  region: AWS_REGION,
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
})

const chimeMessaging = new ChimeSDKMessaging({
  region: AWS_REGION,
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
})

export const getAppInstanceUser = (userArn: string) => {
  try {
    return chimeIdentity
      .describeAppInstanceUser({
        AppInstanceUserArn: userArn,
      })
      .promise()
  } catch (e) {
    console.error(e)
    return null
  }
}

export const createAppInstanceUser = (
  userId: string,
  userDisplayName: string
) =>
  chimeIdentity
    .createAppInstanceUser({
      AppInstanceArn: AWS_CHIME_APP_INSTANCE_ARN,
      AppInstanceUserId: userId,
      ClientRequestToken: uuidv4(),
      Name: userDisplayName,
    })
    .promise()

export const updateAppInstanceUser = (
  appInstanceUserArn: string,
  userDisplayName: string
) =>
  chimeIdentity
    .updateAppInstanceUser({
      AppInstanceUserArn: appInstanceUserArn,
      Name: userDisplayName,
      Metadata: '',
    })
    .promise()

type CreateChannelOptions = Omit<
  CreateChannelRequest,
  'AppInstanceArn' | 'ClientRequestToken' | 'ChimeBearer'
>

export const createChannel = (req: CreateChannelOptions) =>
  chimeMessaging
    .createChannel({
      ...req,
      AppInstanceArn: AWS_CHIME_APP_INSTANCE_ARN,
      ChimeBearer: AWS_CHIME_APP_INSTANCE_USER_ARN,
      ClientRequestToken: uuidv4(),
    })
    .promise()

type CreateChannelMembershipOptions = Omit<
  CreateChannelMembershipRequest,
  'ChimeBearer'
>

export const createChannelMembership = (req: CreateChannelMembershipOptions) =>
  chimeMessaging
    .createChannelMembership({
      ...req,
      ChimeBearer: AWS_CHIME_APP_INSTANCE_USER_ARN,
    })
    .promise()

export const getMessagingSessionEndpoint = () =>
  chimeMessaging.getMessagingSessionEndpoint().promise()

type SendChannelMessageOptions = Omit<
  SendChannelMessageRequest,
  'ClientRequestToken'
>

export const sendChannelMessage = (req: SendChannelMessageOptions) =>
  chimeMessaging
    .sendChannelMessage({
      ...req,
      ClientRequestToken: uuidv4(),
    })
    .promise()

type UpdateChannelMessageOptions = Omit<
  UpdateChannelMessageRequest,
  'ClientRequestToken'
>

export const updateChannelMessage = (req: UpdateChannelMessageOptions) =>
  chimeMessaging
    .updateChannelMessage({
      ...req,
    })
    .promise()

export const listChannelMessages = (req: ListChannelMessagesRequest) =>
  chimeMessaging
    .listChannelMessages({
      ...req,
    })
    .promise()

import { MessagingChannel } from 'models/MessagingChannel'
import { SessionModel } from 'models/Session'

export const messagingChannelPopulationPaths = [
  {
    path: 'participants',
    populate: {
      path: 'profilePicture',
    },
  },
]

export const populateMessagingChannel = async (channel: MessagingChannel) => {
  await channel.populate(messagingChannelPopulationPaths)
  const session = await SessionModel.findOne({ messagingChannel: channel.id })
  if (session) {
    channel.session = session
  }
  return channel
}

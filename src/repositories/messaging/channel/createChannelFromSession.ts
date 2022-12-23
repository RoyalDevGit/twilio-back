import { createChannel } from 'apis/ChimeMessaging'
import { Expert } from 'models/Expert'
import { MessagingChannelModel } from 'models/MessagingChannel'
import { Session } from 'models/Session'
import { User } from 'models/User'
import { messagingChannelPopulationPaths } from 'repositories/messaging/channel/populateMessagingChannel'
import { emitToSession } from 'sockets/userIO'
import { createChimeUserIfNecessary } from 'utils/messaging/chimeAppInstanceUser'

export const createChannelFromSession = async (session: Session) => {
  const sessionExpert = session.expert as Expert
  const sessionConsumer = session.consumer as User
  await createChimeUserIfNecessary(sessionExpert.user)
  await createChimeUserIfNecessary(sessionConsumer)

  const newChannel = new MessagingChannelModel({
    participants: [sessionExpert.user, sessionConsumer],
    session,
  })

  const chimeChannel = await createChannel({
    Name: `Session Channel ${newChannel.id}`,
    Mode: 'RESTRICTED',
    Privacy: 'PRIVATE',
    ChannelId: newChannel.id,
    MemberArns: [
      sessionExpert.user.chimeAppInstanceUserArn as string,
      sessionConsumer.chimeAppInstanceUserArn as string,
    ],
  })
  newChannel.chimeChatChannelArn = chimeChannel.ChannelArn as string
  await newChannel.save()
  await newChannel.populate(messagingChannelPopulationPaths)
  emitToSession(session, 'messagingChannelCreated', newChannel)
  return newChannel
}

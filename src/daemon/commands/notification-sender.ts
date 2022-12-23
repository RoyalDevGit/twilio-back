import { Argv, Options } from 'yargs'

import { notificationSenderJob } from 'daemon/jobs/notificationSender'
import { initializeDaemonConnections } from 'daemon/initializeDaemonConnections'

export const command = 'notification-sender'
export const describe = 'sends queued notifations'

const options: { [key: string]: Options } = {}

export const builder = (yargs: Argv): void => {
  yargs.options(options)
}

export const handler = async (): Promise<void> => {
  await initializeDaemonConnections()
  await notificationSenderJob()
}

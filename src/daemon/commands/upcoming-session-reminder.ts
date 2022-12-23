import { Argv, Options } from 'yargs'

import { initializeDaemonConnections } from 'daemon/initializeDaemonConnections'
import { upcomingSessionReminderJob } from 'daemon/jobs/upcomingSessionReminder'

export const command = 'upcoming-session-reminder'
export const describe =
  'sends a reminder to participants of any upcoming sessions'

const options: { [key: string]: Options } = {}

export const builder = (yargs: Argv): void => {
  yargs.options(options)
}

export const handler = async (): Promise<void> => {
  await initializeDaemonConnections()
  await upcomingSessionReminderJob()
}

import { Argv, Options } from 'yargs'

import { initializeDaemonConnections } from 'daemon/initializeDaemonConnections'
import { unpaidSessionCancellerJob } from 'daemon/jobs/unpaidSessionCanceller'

export const command = 'unpaid-session-canceller'
export const describe =
  'checks for sessions with failed payments that were not updated in the allowed time frame.'

const options: { [key: string]: Options } = {}

export const builder = (yargs: Argv): void => {
  yargs.options(options)
}

export const handler = async (): Promise<void> => {
  await initializeDaemonConnections()
  await unpaidSessionCancellerJob()
}

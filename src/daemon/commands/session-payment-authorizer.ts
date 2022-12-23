import { Argv, Options } from 'yargs'

import { initializeDaemonConnections } from 'daemon/initializeDaemonConnections'
import { sessionPaymentAuthorizerJob } from 'daemon/jobs/sessionPaymentAuthorizer'

export const command = 'session-payment-processor'
export const describe =
  'checks for sessions with full attendance (both expert and consumer) and captures the authorized amount of the related orders. This includes the session order and also any extensions that may have occurred during the life of the session.'

const options: { [key: string]: Options } = {}

export const builder = (yargs: Argv): void => {
  yargs.options(options)
}

export const handler = async (): Promise<void> => {
  await initializeDaemonConnections()
  await sessionPaymentAuthorizerJob()
}

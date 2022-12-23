import { Argv, Options } from 'yargs'

import { sessionPaymentProcessorJob } from 'daemon/jobs/sessionPaymentProcessor'
import { initializeDaemonConnections } from 'daemon/initializeDaemonConnections'

export const command = 'session-payment-processor'
export const describe =
  'checks for finished sessions where both the expert and consumer joined and captures the authorized amount of the related order'

const options: { [key: string]: Options } = {}

export const builder = (yargs: Argv): void => {
  yargs.options(options)
}

export const handler = async (): Promise<void> => {
  await initializeDaemonConnections()
  await sessionPaymentProcessorJob()
}

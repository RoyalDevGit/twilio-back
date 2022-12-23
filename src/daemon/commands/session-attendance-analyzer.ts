import { Argv, Options } from 'yargs'

import { sessionAttendanceAnalyzerJob } from 'daemon/jobs/sessionAttendanceAnalyzer'
import { initializeDaemonConnections } from 'daemon/initializeDaemonConnections'

export const command = 'session-attendance-analyzer'
export const describe =
  'analyzes past sessions and calculates whether both parties joined the session'

const options: { [key: string]: Options } = {}

export const builder = (yargs: Argv): void => {
  yargs.options(options)
}

export const handler = async (): Promise<void> => {
  await initializeDaemonConnections()
  await sessionAttendanceAnalyzerJob()
}

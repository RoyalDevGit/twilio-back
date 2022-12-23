import 'isomorphic-fetch'

import { io } from 'server'
import { initializeDbConnection } from 'utils/db/initializeDbConnection'
import { Env } from 'utils/env'
import { waitForDependencies } from 'utils/server/waitForDependencies'
import { createDbSshTunnel } from 'utils/db/createSshTunnel'
import { configureSocketIO } from 'sockets/configureSocketIO'

const DOCDB_SSH_TUNNEL_ENABLE = Env.getBoolean('DOCDB_SSH_TUNNEL_ENABLE')

export const initializeDaemonConnections = async () => {
  if (DOCDB_SSH_TUNNEL_ENABLE) {
    await createDbSshTunnel()
  }
  await waitForDependencies()
  await initializeDbConnection()
  await configureSocketIO(io)
}

/* eslint-disable import/order */

import {
  initializeNewRelicInstance,
  noticeError,
} from 'utils/newrelic/newrelic-utils'
initializeNewRelicInstance()

import 'isomorphic-fetch'

import { server, io } from 'server'
import { initializeDbConnection } from 'utils/db/initializeDbConnection'
import { Env } from 'utils/env'
import { runDbMigrations } from 'utils/db/runDbMigrations'
import { waitForDependencies } from 'utils/server/waitForDependencies'
import { createDbSshTunnel } from 'utils/db/createSshTunnel'
import { configureSocketIO } from 'sockets/configureSocketIO'
import { configureSearchIndices } from 'search/configureSearchIndices'

process.on('uncaughtException', (err: Error) => {
  noticeError(err)
  console.error('uncaughtException', { ...err })
})

process.on('unhandledRejection', (err: Error) => {
  noticeError(err)
  console.error('unhandledRejection', { ...err })
})

const PORT = Env.getNumber('PORT')
const DOCDB_SSH_TUNNEL_ENABLE = Env.getBoolean('DOCDB_SSH_TUNNEL_ENABLE')

;(async (): Promise<void> => {
  if (DOCDB_SSH_TUNNEL_ENABLE) {
    await createDbSshTunnel()
  }
  await waitForDependencies()
  await configureSearchIndices()
  await runDbMigrations()
  await initializeDbConnection()
  await configureSocketIO(io)

  server.listen(PORT, () => {
    console.log(`Expert Session API running on port ${PORT}`)
  })
})()

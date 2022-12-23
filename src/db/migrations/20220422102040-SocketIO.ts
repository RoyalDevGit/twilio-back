import { Db } from 'mongodb'

import { MigrationFunction } from 'db/MigrationFunction'
import { Env } from 'utils/env'

const DOCDB_DATABASE = Env.getString('DOCDB_DATABASE')
const SOCKET_IO_COLLECTION = Env.getString('SOCKET_IO_COLLECTION')

const MIGRATION_NAME = 'SocketIO'

const up: MigrationFunction = async (db: Db) => {
  try {
    console.log(`Running migration: ${MIGRATION_NAME}`)
    const socketIOCollection = await db.createCollection(SOCKET_IO_COLLECTION)

    await db.command({
      modifyChangeStreams: 1,
      database: DOCDB_DATABASE,
      collection: SOCKET_IO_COLLECTION,
      enable: true,
    })

    await socketIOCollection.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 3600, background: true }
    )
  } catch (e) {
    const err = e as Error
    console.log(`Error doing ${MIGRATION_NAME} migration:`, err.message)
  }
}

const down: MigrationFunction = async (db: Db) => {
  try {
    console.log(`Undoing migration: ${MIGRATION_NAME}`)
    await db.dropCollection(SOCKET_IO_COLLECTION)
  } catch (e) {
    const err = e as Error
    console.log(`Error undoing ${MIGRATION_NAME} migration:`, err.message)
  }
}

module.exports = { up, down }

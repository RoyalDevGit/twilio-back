import { Db } from 'mongodb'

import { MigrationFunction } from 'db/MigrationFunction'
import { Env } from 'utils/env'

const username = Env.getString('DOCDB_USERNAME')
const password = Env.getString('DOCDB_PASSWORD')
const database = Env.getString('DOCDB_DATABASE')

const MIGRATION_NAME = 'InitDb'

const up: MigrationFunction = async (db: Db) => {
  try {
    console.log(`Running migration: ${MIGRATION_NAME}`)
    await db.addUser(username, password, {
      roles: [{ role: 'dbOwner', db: database }],
    })
  } catch (e) {
    const err = e as Error
    console.log(`Error doing ${MIGRATION_NAME} migration:`, err.message)
  }
}

const down: MigrationFunction = async (db: Db) => {
  try {
    console.log(`Undoing migration: ${MIGRATION_NAME}`)
    await db.removeUser(username)
  } catch (e) {
    const err = e as Error
    console.log(`Error undoing ${MIGRATION_NAME} migration:`, err.message)
  }
}

module.exports = { up, down }

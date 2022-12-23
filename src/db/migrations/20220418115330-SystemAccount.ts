import { Db } from 'mongodb'

import { MigrationFunction } from 'db/MigrationFunction'

const MIGRATION_NAME = 'SystemAccount'

const up: MigrationFunction = async (db: Db) => {
  try {
    console.log(`Running migration: ${MIGRATION_NAME}`)
    const users = await db.collection('users')
    const existingSystemAccount = await users.findOne({
      isSystemAccount: true,
    })
    if (existingSystemAccount) {
      return
    }
    await users.insertOne({
      firstName: 'System',
      lastName: 'Account',
      isSystemAccount: true,
    })
  } catch (e) {
    const err = e as Error
    console.log(`Error doing ${MIGRATION_NAME} migration:`, err.message)
    throw e
  }
}

const down: MigrationFunction = async (db: Db) => {
  try {
    console.log(`Undoing migration: ${MIGRATION_NAME}`)
    const users = await db.collection('users')
    await users.deleteMany({
      isSystemAccount: true,
    })
  } catch (e) {
    const err = e as Error
    console.log(`Error undoing ${MIGRATION_NAME} migration:`, err.message)
    throw e
  }
}

module.exports = { up, down }

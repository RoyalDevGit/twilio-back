/* eslint-disable @typescript-eslint/ban-ts-comment */
import { database, up } from 'migrate-mongo'

export const runDbMigrations = async (): Promise<void> => {
  try {
    console.log('Running DB migrations')
    // Have to do this in order to get migrate-mongo to work with Typescript
    // @ts-ignore
    global.options = {
      file: './dist/migrate-mongo-config.js',
    }
    const { db, client } = await database.connect()
    const migrated = await up(db, client)
    migrated.forEach((fileName) => console.log('Migrated:', fileName))
    // Undo global change after migrations are done
    // @ts-ignore
    global.options = undefined
    console.log('DB migrations ran successfully')
  } catch (e) {
    const err = e as Error
    console.error(
      `An unexpected error occurred while running DB migrations. Error: ${err.message}`
    )
    throw e
  }
}

import { config } from 'migrate-mongo'
import { MongoClientOptions } from 'mongodb'

import { Env } from 'utils/env'
import {
  getConnectionStringOptions,
  getDbClientOptions,
} from 'utils/db/getDbOptions'

const DOCDB_INITDB_ROOT_USERNAME = Env.getString('DOCDB_INITDB_ROOT_USERNAME')
const DOCDB_INITDB_ROOT_PASSWORD = Env.getString('DOCDB_INITDB_ROOT_PASSWORD')

const { host, port, database } = getConnectionStringOptions()
const clientOptions = getDbClientOptions()

const mongoMigrateConfig: config.Config = {
  mongodb: {
    url: `mongodb://${encodeURIComponent(
      DOCDB_INITDB_ROOT_USERNAME
    )}:${encodeURIComponent(DOCDB_INITDB_ROOT_PASSWORD)}@${host}:${port}`,
    databaseName: database,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    options: clientOptions as MongoClientOptions,
  },
  migrationsDir: './dist/src/db/migrations',
  changelogCollectionName: 'migrations_changelog',
}
module.exports = mongoMigrateConfig

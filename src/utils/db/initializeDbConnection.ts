import mongoose, { ConnectOptions } from 'mongoose'

import { Env } from 'utils/env'
import {
  getConnectionStringOptions,
  getDbClientOptions,
} from 'utils/db/getDbOptions'

const DOCDB_USERNAME = Env.getString('DOCDB_USERNAME')
const DOCDB_PASSWORD = Env.getString('DOCDB_PASSWORD')

export const initializeDbConnection = async (): Promise<void> => {
  console.log('Connecting to database...')
  const { host, port, database } = getConnectionStringOptions()
  const clientOptions = getDbClientOptions()
  await mongoose.connect(
    `mongodb://${encodeURIComponent(DOCDB_USERNAME)}:${encodeURIComponent(
      DOCDB_PASSWORD
    )}@${host}:${port}/${database}`,
    clientOptions as ConnectOptions
  )
  console.log('Connected to database')
}

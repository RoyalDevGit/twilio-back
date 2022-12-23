import { MongoClientOptions, ReadPreferenceMode } from 'mongodb'
import { ConnectOptions } from 'mongoose'

import { Env } from 'utils/env'

const DOCDB_DATABASE = Env.getString('DOCDB_DATABASE')
const DOCDB_HOST = Env.getString('DOCDB_HOST')
const DOCDB_PORT = Env.getNumber('DOCDB_PORT')
const DOCDB_TLS = Env.getBoolean('DOCDB_TLS')
const DOCDB_VALIDATE_SSL = Env.getBoolean('DOCDB_VALIDATE_SSL')
const DOCDB_SSL_PRIVATE_KEY_PATH = Env.getString('DOCDB_SSL_PRIVATE_KEY_PATH')
const DOCDB_SSH_TUNNEL_ENABLE = Env.getBoolean('DOCDB_SSH_TUNNEL_ENABLE')
const DOCDB_SSH_TUNNEL_LOCAL_HOST = Env.getString('DOCDB_SSH_TUNNEL_LOCAL_HOST')
const DOCDB_SSH_TUNNEL_LOCAL_PORT = Env.getNumber('DOCDB_SSH_TUNNEL_LOCAL_PORT')
const DOCDB_RETRY_WRITES = Env.getBoolean('DOCDB_RETRY_WRITES')
const DOCDB_DIRECT_CONNECTION = Env.getBoolean('DOCDB_DIRECT_CONNECTION')
const DOCDB_TLS_ALLOW_INVALID_HOSTNAMES = Env.getBoolean(
  'DOCDB_TLS_ALLOW_INVALID_HOSTNAMES'
)
const DOCDB_REPLICA_SET = Env.getString('DOCDB_REPLICA_SET')
const DOCDB_READ_PREFERENCE = Env.getString('DOCDB_READ_PREFERENCE')

export interface ConnectionStringOptions {
  host: string
  port: number
  database: string
}

export const getConnectionStringOptions = (): ConnectionStringOptions => {
  if (DOCDB_SSH_TUNNEL_ENABLE) {
    return {
      host: DOCDB_SSH_TUNNEL_LOCAL_HOST,
      port: DOCDB_SSH_TUNNEL_LOCAL_PORT,
      database: DOCDB_DATABASE,
    }
  } else {
    return {
      host: DOCDB_HOST,
      port: DOCDB_PORT,
      database: DOCDB_DATABASE,
    }
  }
}

export const getDbClientOptions = (): MongoClientOptions | ConnectOptions => ({
  tls: DOCDB_TLS,
  sslValidate: DOCDB_VALIDATE_SSL,
  tlsAllowInvalidHostnames: DOCDB_TLS_ALLOW_INVALID_HOSTNAMES,
  directConnection: DOCDB_DIRECT_CONNECTION,
  retryWrites: DOCDB_RETRY_WRITES,
  tlsCAFile: DOCDB_TLS ? DOCDB_SSL_PRIVATE_KEY_PATH : undefined,
  replicaSet: DOCDB_REPLICA_SET ? DOCDB_REPLICA_SET : undefined,
  readPreference: DOCDB_READ_PREFERENCE
    ? (DOCDB_READ_PREFERENCE as ReadPreferenceMode)
    : undefined,
})

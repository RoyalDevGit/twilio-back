import fs from 'fs'
import { Server } from 'net'

import tunnel from 'tunnel-ssh'

import { Env } from 'utils/env'

const DOCDB_SSH_TUNNEL_HOST = Env.getString('DOCDB_SSH_TUNNEL_HOST')
const DOCDB_SSH_TUNNEL_PORT = Env.getNumber('DOCDB_SSH_TUNNEL_PORT')
const DOCDB_SSH_TUNNEL_USERNAME = Env.getString('DOCDB_SSH_TUNNEL_USERNAME')
const DOCDB_SSH_TUNNEL_PRIVATE_KEY_PATH = Env.getString(
  'DOCDB_SSH_TUNNEL_PRIVATE_KEY_PATH'
)
const DOCDB_HOST = Env.getString('DOCDB_HOST')
const DOCDB_PORT = Env.getNumber('DOCDB_PORT')
const DOCDB_SSH_TUNNEL_LOCAL_HOST = Env.getString('DOCDB_SSH_TUNNEL_LOCAL_HOST')
const DOCDB_SSH_TUNNEL_LOCAL_PORT = Env.getNumber('DOCDB_SSH_TUNNEL_LOCAL_PORT')
const DOCDB_SSH_TUNNEL_KEEPALIVE = Env.getBoolean('DOCDB_SSH_TUNNEL_KEEPALIVE')

export const createDbSshTunnel = (): Promise<Server> => {
  console.log('Creating DB SSH Tunnel...')
  const tunnelConfig = {
    username: DOCDB_SSH_TUNNEL_USERNAME,
    privateKey: fs.readFileSync(DOCDB_SSH_TUNNEL_PRIVATE_KEY_PATH),
    host: DOCDB_SSH_TUNNEL_HOST,
    port: DOCDB_SSH_TUNNEL_PORT,
    dstHost: DOCDB_HOST,
    dstPort: DOCDB_PORT,
    localHost: DOCDB_SSH_TUNNEL_LOCAL_HOST,
    localPort: DOCDB_SSH_TUNNEL_LOCAL_PORT,
    keepAlive: DOCDB_SSH_TUNNEL_KEEPALIVE,
  }

  return new Promise((resolve, reject) => {
    tunnel(tunnelConfig, function (error, server) {
      if (error) {
        console.error('Creating DB SSH Tunner failed.', error)
        reject(error)
      }
      console.log('Created DB SSH Tunnel successfully')
      resolve(server)
    })
  })
}

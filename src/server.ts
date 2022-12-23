import http from 'http'
import https from 'https'
import fs from 'fs'

import { Server } from 'socket.io'

import { app } from 'app'
import { Env } from 'utils/env'

const SSL_CERT_PATH = Env.getString('SSL_CERT_PATH')
const SSL_KEY_PATH = Env.getString('SSL_KEY_PATH')
const CORS_ALLOWED_ORIGIN = Env.getString('CORS_ALLOWED_ORIGIN')

const useHttps = SSL_CERT_PATH && SSL_KEY_PATH

let server: http.Server | https.Server
if (useHttps) {
  const httpsOptions = {
    key: fs.readFileSync(SSL_KEY_PATH),
    cert: fs.readFileSync(SSL_CERT_PATH),
  }
  server = https.createServer(httpsOptions, app)
} else {
  server = http.createServer(app)
}

const io = new Server(server, {
  cors: {
    origin: [...CORS_ALLOWED_ORIGIN.split(',')],
    credentials: true,
  },
})

export { server, io }

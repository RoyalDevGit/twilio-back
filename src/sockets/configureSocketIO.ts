import { createAdapter } from '@socket.io/mongo-adapter'
import { MongoClient, MongoClientOptions } from 'mongodb'
import { Server } from 'socket.io'
import { DefaultEventsMap } from 'socket.io/dist/typed-events'
import { Emitter } from '@socket.io/mongo-emitter'

import { Env } from 'utils/env'
import {
  getConnectionStringOptions,
  getDbClientOptions,
} from 'utils/db/getDbOptions'
import { socketI18nMiddleware } from 'middleware/i18nMiddleware'
import { configureUserIO } from 'sockets/userIO'

const SOCKET_IO_COLLECTION = Env.getString('SOCKET_IO_COLLECTION')
const DOCDB_USERNAME = Env.getString('DOCDB_USERNAME')
const DOCDB_PASSWORD = Env.getString('DOCDB_PASSWORD')

export type SocketIOServer = Server<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>

export let emitter: Emitter

/**
 * The bidirectional channel between the Socket.IO server (Node.js) and the Socket.IO client (browser, Node.js, or another programming language)
 * is established with a WebSocket connection whenever possible, and will use HTTP long-polling as fallback.
 * https://socket.io/docs/v4/how-it-works/
 * https://socket.io/docs/v4/server-instance/
 * @param io
 */
export const configureSocketIO = async (io: SocketIOServer) => {
  const { host, port, database } = getConnectionStringOptions()
  const clientOptions = getDbClientOptions()

  /**
   * We need to connect to our database so that we can stream socket events to it.
   */
  const mongoClient = new MongoClient(
    `mongodb://${encodeURIComponent(DOCDB_USERNAME)}:${encodeURIComponent(
      DOCDB_PASSWORD
    )}@${host}:${port}/${database}`,
    {
      ...(clientOptions as MongoClientOptions),
      readPreference: 'primary',
    }
  )

  await mongoClient.connect()

  const mongoCollection = mongoClient
    .db(database)
    .collection(SOCKET_IO_COLLECTION)

  /**
   * We need to set a TTL index on our collection so that it cleans itself up after an hour.
   * If we don't do this, the events will pile up and never be cleaned
   * https://www.mongodb.com/docs/manual/tutorial/expire-data/
   */
  try {
    await mongoCollection.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 3600, background: true }
    )
  } catch (e) {
    console.error(e)
  }

  /**
   * An Adapter is a server-side component which is responsible for broadcasting events to all or a subset of clients.
   * When scaling to multiple Socket.IO servers, you will need to replace the default in-memory adapter by another implementation,
   * so the events are properly routed to all clients. In this case we are using Mongo's adapter.
   * https://socket.io/docs/v4/mongo-adapter/
   */
  io.adapter(
    createAdapter(mongoCollection, {
      addCreatedAtField: true,
    })
  )

  /**
   * Most adapter implementations come with their associated emitter package,
   * which allows communicating to the group of Socket.IO servers from another Node.js process.
   * https://socket.io/docs/v4/adapter/#emitter-cheatsheet
   */
  emitter = new Emitter(mongoCollection)
  io.use(socketI18nMiddleware)
  configureUserIO(io)
}

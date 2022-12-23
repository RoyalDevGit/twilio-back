import { AuthenticatedSocketIORequest } from 'interfaces/AppSocketIORequest'
import { socketAuthMiddleware } from 'middleware/authMiddleware'
import { socketI18nMiddleware } from 'middleware/i18nMiddleware'
import { User } from 'models/User'
import { emitter, SocketIOServer } from 'sockets/configureSocketIO'
import { Expert } from 'models/Expert'
import { Session } from 'models/Session'
import { toPlainObject } from 'utils/object/toPlainObject'

const createUserRoom = (user: User) => `user:${user.id}`

export const configureUserIO = (io: SocketIOServer) => {
  /**
   * Initializes and retrieves the users namespace.
   * If the namespace was already initialized it returns it immediately.
   * https://socket.io/docs/v4/server-api/#serverofnsp
   *
   * A Namespace is a communication channel that allows you to split the logic of
   * your application over a single shared connection (also called "multiplexing").
   * https://socket.io/docs/v4/namespaces/
   */
  const userIO = io
    .of('/users')
    .use(socketI18nMiddleware)
    .use(socketAuthMiddleware)

  /**
   * This is fired anytime a user connects from the client
   */
  userIO.on('connection', async (socket) => {
    const { user } = socket.request as AuthenticatedSocketIORequest

    /**
     * A room is an arbitrary channel that sockets can join and leave.
     * It can be used to broadcast events to a subset of clients.
     * https://socket.io/docs/v4/rooms/
     * https://socket.io/docs/v4/server-api/#socketjoinroom
     * @param io
     */
    const userRoom = createUserRoom(user)
    await socket.join(userRoom)

    socket.on('disconnect', () => {
      userIO.to(userRoom).emit('userDisconnected', user)
    })
  })
}

export type UserRealTimeEvent =
  | 'notificationCreated'
  | 'messagingChannelCreated'
  | 'messagingChannelMarkedAsRead'
  | 'sessionExtensionCreated'
  | 'sessionExtensionDeclined'
  | 'sessionExtensionAccepted'
  | 'sessionExtensionWithdrawn'
  | 'sessionExtensionComplete'

export const emitToUser = (
  user: User,
  eventName: UserRealTimeEvent,
  data: unknown
) => {
  const userIO = emitter.of('/users')
  const userRoom = createUserRoom(user)
  userIO.to(userRoom).emit(eventName, toPlainObject(data))
}

export const emitToUsers = (
  users: User[],
  eventName: UserRealTimeEvent,
  data: unknown
) => {
  users.forEach((u) => emitToUser(u, eventName, data))
}

export const emitToSession = (
  session: Session,
  eventName: UserRealTimeEvent,
  data: unknown
) => {
  const expert = session.expert as Expert
  const consumer = session.consumer as User

  emitToUsers([expert.user, consumer], eventName, toPlainObject(data))
}

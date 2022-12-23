import { Socket } from 'socket.io'
import { ExtendedError } from 'socket.io/dist/namespace'

export type SocketIOMiddleware = (
  socket: Socket,
  next: (err?: ExtendedError) => void
) => void

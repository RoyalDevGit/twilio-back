import { Readable as ReadableStream, Writable as WritableStream } from 'stream'
import { Buffer } from 'buffer'
export function readableNoopStream({ size = 0, ...options } = {}) {
  let producedSize = 0

  return new ReadableStream({
    ...options,
    read(readSize) {
      let shouldEnd = false

      if (producedSize + readSize >= size) {
        readSize = size - producedSize
        shouldEnd = true
      }

      setImmediate(() => {
        if (size === 0) {
          this.push(null)
        }

        producedSize += readSize
        this.push(Buffer.alloc(readSize))

        if (shouldEnd) {
          this.push(null)
        }
      })
    },
  })
}

export function writableNoopStream() {
  return new WritableStream({
    write(_chunk, _encoding, callback) {
      setImmediate(callback)
    },
  })
}

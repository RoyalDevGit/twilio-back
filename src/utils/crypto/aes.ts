// crypto module
import crypto from 'crypto'

const ALGORITHM = 'aes-256-ctr'
const INPUT_ENCODING = 'utf-8'
const OUTPUT_ENCODING = 'hex'

export const encrypt = (message: string, key: crypto.CipherKey) => {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encryptedData = cipher.update(message, INPUT_ENCODING, OUTPUT_ENCODING)
  encryptedData = `${iv.toString(
    OUTPUT_ENCODING
  )}:${encryptedData}${cipher.final(OUTPUT_ENCODING)}`
  return encryptedData
}

export const decrypt = (encryptedData: string, key: crypto.CipherKey) => {
  const [iv, message] = encryptedData.split(':')

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, OUTPUT_ENCODING)
  )

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(message, OUTPUT_ENCODING)),
    decipher.final(),
  ]).toString(INPUT_ENCODING)

  return decrypted
}

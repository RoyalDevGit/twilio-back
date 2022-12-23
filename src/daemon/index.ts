#!/usr/bin/env node
import dotenv from 'dotenv'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { serializeError } from 'serialize-error'

import { createLogger } from 'utils/logger/createLogger'

dotenv.config()

const logger = createLogger('es-daemon-command')

process.on('uncaughtException', (err: Error) => {
  logger.error('uncaughtException', serializeError(err))
})

process.on('unhandledRejection', (err: Error) => {
  logger.error('unhandledRejection', serializeError(err))
})

yargs(hideBin(process.argv))
  .commandDir('./commands', {
    extensions: ['js', 'ts'],
  })
  .help()
  .demandCommand(1, 'You need at least one command before moving on').argv

import dotenv from 'dotenv'
import winston from 'winston'

import { Env } from 'utils/env'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const newrelicFormatter = require('@newrelic/winston-enricher')

dotenv.config()

const newrelicWinstonFormatter = newrelicFormatter(winston)
const NEW_RELIC_APP_NAME = Env.getString('NEW_RELIC_APP_NAME')
const NEW_RELIC_LICENSE_KEY = Env.getString('NEW_RELIC_LICENSE_KEY')

const getFormatter = () => {
  if (NEW_RELIC_APP_NAME && NEW_RELIC_LICENSE_KEY) {
    return winston.format.combine(
      newrelicWinstonFormatter(),
      winston.format.json()
    )
  }
  return winston.format.json()
}

export const createLogger = (serviceName: string) => {
  const logger = winston.createLogger({
    level: 'info',
    format: getFormatter(),
    defaultMeta: { service: serviceName },
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
      }),
    ],
  })
  return logger
}

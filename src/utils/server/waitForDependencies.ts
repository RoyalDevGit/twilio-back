import waitOn from 'wait-on'

import { getConnectionStringOptions } from 'utils/db/getDbOptions'

const { host, port } = getConnectionStringOptions()

const opts = {
  resources: [`tcp:${host}:${port}`],
  delay: 1000, // initial delay in ms, default 0
  interval: 100, // poll interval in ms, default 250ms
  simultaneous: 1, // limit to 1 connection per resource at a time
  timeout: 30000, // timeout in ms, default Infinity
  tcpTimeout: 1000, // tcp timeout in ms, default 300ms
  window: 1000, // stabilization time in ms, default 750ms
}

export const waitForDependencies = () => {
  try {
    console.log('Waiting for dependencies...')
    waitOn(opts)
    console.log('Dependencies are up')
  } catch (e) {
    console.error('Dependency check failed.', e)
    throw e
  }
}

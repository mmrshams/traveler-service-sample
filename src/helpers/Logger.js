import { LoggerGenerator } from '@gokiteam/logger'

const Logger = ({ ApplicationConfig: Config }) => {
  const { environment } = Config
  return LoggerGenerator({
    logLevel: Config.logLevel || 'debug',
    transports: { console: true, blackbox: environment === 'development' },
    blackboxConfig: {
      redis: Config.cache,
      serviceName: require('../../package.json').name
    }
  })
}

export default Logger

import { Oops } from '@gokiteam/oops'
import _ from 'lodash'

const ErrorLogger = ({ ApplicationConfig: Config, LoggerHelper: Logger, RollbarHelper }) => ({
  log (error, message, data, request) {
    if (data && !_.isPlainObject(data)) throw Oops.invalidArgument('data should be instance of object')
    if (!message && !error.message) message = 'unknown error'
    if (!message) message = error.message
    const log = {
      level: (error.data && error.data.status && error.data.status < 500) ? 'info' : 'error',
      message,
      ...data
    }
    const errorData = { message: 'unknown error', stack: '', data: {} }
    if (error) {
      const { message, stack, data } = error
      if (message) errorData.message = message
      if (stack) errorData.stack = stack
      if (data) errorData.data = data
    }
    log.error = errorData
    Logger.log(log)
    if (Config.rollbar.enabled && (!error.isOops || (error.isOops && error.data.status > 499))) {
      RollbarHelper.error(error, request)
    }
  }
})

export default ErrorLogger

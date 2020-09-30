import RollbarLibrary from 'rollbar'

const Rollbar = ({ ApplicationConfig: Config }) => {
  const checkIgnore = function (isUncaught, args, payload) {
    if (payload.body &&
      payload.body.trace_chain &&
      payload.body.trace_chain[0] &&
      payload.body.trace_chain[0].exception) {
      const { message } = payload.body.trace_chain[0].exception
      const regex = /^failed to "(acknowledge|modifyackdeadline)".*$/
      if (message.toLowerCase().match(regex)) {
        return true
      }
    }
    return false
  }
  const rollbar = new RollbarLibrary({
    accessToken: Config.rollbar.accessToken,
    environment: Config.environment,
    captureUncaught: true,
    captureUnhandledRejections: true,
    checkIgnore: checkIgnore
  })
  return rollbar
}

export default Rollbar

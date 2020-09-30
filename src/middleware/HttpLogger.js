// This is a http logger middleware which can be used to log request & responses.
// Pass a valid winston logger to the middleware.
// Make sure to use this middleware before other middleware to capture everything
import IdGenerator from 'uuid'

const HttpLogger = ({ LoggerHelper: Logger }) => async (ctx, next) => {
  const {
    method, url, origin, query, body, headers
  } = ctx.request
  const requestId = IdGenerator.v4()
  if (url !== '/') {
    Logger.log({
      level: (url === '/ready' || url === '/live') ? 'debug' : 'http',
      message: `request: ${method.toUpperCase()} ${url}`,
      requestId,
      method,
      url,
      origin,
      query,
      body,
      headers
    })
  }
  await next()
  if (url !== '/') {
    const {
      status, body: resBody, headers: resHeaders
    } = ctx.response
    Logger.log({
      level: status >= 500 ? 'error' : (url === '/ready' || url === '/live') ? 'debug' : 'http',
      message: `response: [${status}] ${method} ${url}`,
      requestId,
      method,
      url,
      status,
      headers: resHeaders,
      body: resBody
    })
  }
}

export default HttpLogger

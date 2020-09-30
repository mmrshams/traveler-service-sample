// This middleware formats replies before sending them out of the server.
// Most commonly used HTTP statuses are covered.
// Feel free to add more statuses or implement whole middleware from scratch.
// The responses will be formatted like these:
//
// Success
// ```
// {
//   data: Object
// }
// ```
//
// Error
// ```
// {
//   error: {
//     status: Number,
//     title: String,
//     message: String,
//     code: Number,
//     resource: String,
//     meta: Any
//   }
// }
// ```

import { Oops } from '@gokiteam/oops'

const defaultErrors = {
  400: { title: 'Bad Request', message: 'Request data is not valid.' },
  401: { title: 'Unauthorized', message: 'You have not access to the requested resource.' },
  403: { title: 'Forbidden', message: 'Access to the requested resource is forbidden.' },
  404: { title: 'Not Found', message: 'The requested resource is not found.' },
  405: { title: 'Method Not Allowed', message: 'The method is not allowed on the requested resource.' },
  406: { title: 'Not Acceptable', message: 'The requested data format is not acceptable by the requested resource.' },
  409: { title: 'Conflict', message: 'A conflict occurred with the request.' },
  429: { title: 'Too Many Requests', message: 'Too many requests were made to the resource.' },
  500: { title: 'Bad Implementation', message: 'Sorry! Something went wrong when trying to process the request.' },
  501: { title: 'Not Implemented', message: 'The requested resource is not implemented yet.' },
  503: {
    title: 'Service Unavailable',
    message: 'Unfortunately service is not available right now! Please try again later.'
  }
}

const beautifySuccess = (ctx) => {
  ctx.body = {
    data: ctx.body || {}
  }
}

const beautifyErrors = (ctx) => {
  const { error } = ctx
  if (error.isOops) {
    const { error: oopsError } = error
    if (!oopsError.title) {
      oopsError.title = defaultErrors[oopsError.status] ? defaultErrors[oopsError.status].title : 'Unknown Error'
    }
    if (!oopsError.message) {
      oopsError.message = defaultErrors[oopsError.status] ? defaultErrors[oopsError.status].message : 'Unknown Error'
    }
    ctx.status = oopsError.status
    ctx.body = { error: oopsError }
  } else {
    ctx.status = 500
    ctx.body = {
      error: Oops.unknown(error.toString()).error
    }
  }
}

const Reply = ({ ErrorLoggerHelper: ErrorLogger }) => {
  return async (ctx, next) => {
    await next()
    // checks if it's route not found response
    if (!ctx.error && ctx.status === 404) {
      ctx.error = Oops.notFound('the requested endpoint not found!')
    }
    if (!ctx.error) {
      beautifySuccess(ctx)
    } else {
      ErrorLogger.log(ctx.error, null, null, ctx.request)
      beautifyErrors(ctx)
    }
  }
}

export default Reply

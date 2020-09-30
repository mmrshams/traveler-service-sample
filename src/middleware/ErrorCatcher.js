// Error catcher middleware catches errors from controllers and assign them to ctx.error
// This middle should be placed right before routes middleware

const ErrorCatcher = () => {
  return async (ctx, next) => {
    try {
      await next()
    } catch (error) {
      ctx.error = error
    }
  }
}

export default ErrorCatcher

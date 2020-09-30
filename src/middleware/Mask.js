import JsonMask from 'json-mask'

const Mask = () => {
  return async (ctx, next) => {
    const mask = ctx.get('mask')
    await next()
    if (mask && ctx.body && ctx.body.data) {
      if (ctx.body.data.list) {
        ctx.body.data.list = JsonMask(ctx.body.data.list, mask)
      } else {
        ctx.body.data = JsonMask(ctx.body.data, mask)
      }
    }
  }
}

export default Mask

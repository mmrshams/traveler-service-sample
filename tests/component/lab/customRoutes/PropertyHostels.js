const Router = require('koa-router')

const router = new Router()

router
  .post('/v1/hostels/settings/batch', ctx => {
    const { body } = ctx.request
    const ids = body.ids

    const res = ids.split(',').filter(i => i !== '').reduce((obj, id) => {
      obj[id] = {
        keepTravelerInfoAfterRemove: false
      }
      return obj
    }, {})
    ctx.body = { data: res }
  })

module.exports = router

// The middleware should be used before validator middleware if it's needed to convert string array query param
// like "name,age,foo,bar" to an array. Pass the name of the query params to the middleware.

import _ from 'lodash'

export default () =>
  (paramNames, sourceName = 'query') =>
    async (ctx, next) => {
      const source = sourceName === 'body' ? ctx.request.body : ctx.query
      paramNames.forEach(paramName => {
        const stringArray = _.get(source, paramName)
        if (stringArray) _.set(source, paramName, stringArray.split(','))
      })
      await next()
    }

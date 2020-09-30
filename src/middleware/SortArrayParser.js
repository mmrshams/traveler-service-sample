// The middleware should be used before validator middleware if it's needed to convert sort array query param
// like "foo,-bar,zoo" to an array of sort objects. Pass the name of the query param to the middleware.
// For example the "foo,-bar,zoo" will be converted to
// [
//   { field: "foo", order: "asc" }
//   { field: "bar", order: "desc" }
//   { field: "zoo", order: "asc" }
// ]

export default () =>
  (paramName = 'sort') =>
    async (ctx, next) => {
      if (ctx.query[paramName]) {
        const sort = ctx.query[paramName].split(',')
        const newSort = []
        if (sort.length > 0) {
          sort.forEach(item => {
            const startsWithMinus = item.startsWith('-')
            const order = startsWithMinus ? 'desc' : 'asc'
            const field = startsWithMinus ? item.substring(1) : item
            newSort.push({ field, order })
          })
        }
        ctx.query[paramName] = newSort
      }
      await next()
    }

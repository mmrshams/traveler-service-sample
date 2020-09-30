// This sample module includes all routes related to travelers resource endpoints

import Router from 'koa-router'

const Routes = ({
  ReportsValidators: Validators,
  ReportsControllers: Controllers,
  StringArrayParserMiddleware,
  SortArrayParserMiddleware
}) => {
  const router = new Router()
  const v1 = new Router({ prefix: '/v1' })
  v1
    .get(
      '/reports',
      StringArrayParserMiddleware([ 'extend' ]),
      SortArrayParserMiddleware('sort'),
      Validators.list,
      Controllers.list
    )
    .patch(
      '/reports',
      Validators.createOrUpdate,
      Controllers.createOrUpdate
    )
  router.use(v1.routes())
  return router
}
export default Routes

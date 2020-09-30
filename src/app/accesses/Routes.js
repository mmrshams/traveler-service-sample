import Router from 'koa-router'

const Routes = ({
  AccessesValidators: Validators, AccessesControllers: Controllers
}) => {
  const router = new Router()
  const v1 = new Router({ prefix: '/v1' })
  v1
    .patch(
      '/accesses',
      Validators.createOrOverwrite,
      Controllers.createOrOverwrite
    )
    .get(
      '/accesses',
      Validators.list,
      Controllers.list
    )
    .post(
      '/accesses/:id/accept',
      Validators.accept,
      Controllers.accept
    )
    .post(
      '/accesses/:id/deny',
      Validators.deny,
      Controllers.deny
    )
  router.use(v1.routes())
  return router
}

export default Routes

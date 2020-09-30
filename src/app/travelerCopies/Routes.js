import Router from 'koa-router'

const Routes = ({
  TravelerCopiesValidators: Validators,
  TravelerCopiesControllers: Controllers
}) => {
  const router = new Router()
  const v1 = new Router({ prefix: '/v1' })
  v1
    .get(
      '/travelerCopies',
      Validators.list,
      Controllers.list
    )
  router.use(v1.routes())
  return router
}
export default Routes

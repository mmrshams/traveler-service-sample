import Router from 'koa-router'

const Routes = ({
  HealthValidators: Validators, HealthControllers: Controllers
}) => {
  const router = new Router()

  router
    .get(
      '/live',
      Validators.defaultValidator,
      Controllers.checkLiveness
    )
    .get(
      '/ready',
      Validators.defaultValidator,
      Controllers.checkReadiness
    )

  return router
}

export default Routes

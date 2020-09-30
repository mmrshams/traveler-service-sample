// This sample module includes all routes related to travelers resource endpoints

import Router from 'koa-router'

const Routes = ({
  TravelersValidators: Validators,
  TravelersControllers: Controllers,
  StringArrayParserMiddleware
}) => {
  const router = new Router()
  const v1 = new Router({ prefix: '/v1' })
  v1
    .post(
      '/travelers',
      Validators.signup,
      Controllers.signup
    )
    .patch(
      '/travelers/login',
      Validators.login,
      Controllers.login
    )
    .post(
      '/travelers/verify',
      Validators.verify,
      Controllers.verify
    )
    .post(
      '/travelers/pin/generate',
      Validators.generatePin,
      Controllers.generatePin
    )
    .post(
      '/travelers/verification/resend',
      Validators.resendVerification,
      Controllers.resendVerification
    )
    .post(
      '/travelers/pin/verify',
      Validators.verifyPin,
      Controllers.verifyPin
    )
    .get(
      '/travelers',
      StringArrayParserMiddleware([ 'filter.travelerIds', 'filter.interests' ]),
      Validators.list,
      Controllers.list
    )
    .post(
      '/travelers/batch',
      StringArrayParserMiddleware([ 'ids' ], 'body'),
      Validators.batchDetails,
      Controllers.batchDetails
    )
    .get(
      '/travelers/find',
      Validators.emailValidator,
      Controllers.find
    )
    .post(
      '/travelers/batchFind',
      StringArrayParserMiddleware([ 'emails' ], 'body'),
      Validators.batchFind,
      Controllers.batchFind
    )
    .get(
      '/travelers/verification',
      Validators.emailValidator,
      Controllers.getVerification
    )
    .get(
      '/travelers/:id',
      StringArrayParserMiddleware(['extend']),
      Validators.details,
      Controllers.details
    )
    .get(
      '/travelers/:id/verification/status',
      Validators.idValidator,
      Controllers.getVerificationStatus
    )
    .patch(
      '/travelers/:id/avatar',
      Validators.setAvatar,
      Controllers.setAvatar
    )
    .patch(
      '/travelers/:id',
      Validators.update,
      Controllers.update
    )
    .post(
      '/travelers/:id/deactivate',
      Validators.idValidator,
      Controllers.deactivate
    )
    .delete(
      '/travelers/:id',
      Validators.idValidator,
      Controllers.remove
    )
    .patch(
      '/travelers/:id/health',
      Validators.updateHealth,
      Controllers.updateHealth
    )
    .post(
      '/travelers/:id/acceptTerms',
      Validators.acceptTerms,
      Controllers.acceptTerms
    )
  router.use(v1.routes())
  return router
}
export default Routes

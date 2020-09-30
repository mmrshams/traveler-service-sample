// This sample module includes all controller middleware related to travelers resource endpoints
import { Oops } from '@gokiteam/oops'
import Moment from 'moment'
const Controllers = ({
  ApplicationConfig: Config,
  TravelerEmailModel,
  AcceptedTermModel,
  ErrorReasonEnum,
  HealthEnum,
  StateEnum,
  TravelerModel,
  TravelersLogic,
  PubSubPublishHelper,
  VerificationStatusEnum
}) => ({
  async signup (ctx) {
    const { body: data } = ctx.request
    ctx.body = await TravelersLogic.signup(data)
  },
  async verify (ctx) {
    const { body: data } = ctx.request
    ctx.body = await TravelersLogic.verify(data)
  },
  async generatePin (ctx) {
    const { body: data } = ctx.request
    const travelerEmail = await TravelerEmailModel.getByEmail(data.email)
    const { travelerId } = travelerEmail.doc
    const traveler = await TravelerModel.find(travelerId, { mask: '*' })
    if (traveler.health === HealthEnum.blocked) {
      throw Oops.permissionDenied('Your account is blocked!').reason(ErrorReasonEnum.accountIsBlocked)
    }
    const { recovery } = await travelerEmail.setPin().update({ mask: '*' })
    PubSubPublishHelper.publish({ topic: Config.pubSub.topics.travelerPinGenerated, data: { traveler, recovery } })
    ctx.body = { pin: travelerEmail.doc.recovery.pin }
  },
  async resendVerification (ctx) {
    const { email } = ctx.request.body
    const travelerEmail = await TravelerEmailModel.getByEmail(email)
    const { travelerId, verification } = travelerEmail.doc
    if (verification.verifiedAt) {
      throw Oops.notAcceptable('Already verified!')
    }
    const traveler = await TravelerModel.find(travelerId)
    PubSubPublishHelper
      .publish({ topic: Config.pubSub.topics.travelerVerificationRequired, data: { traveler, verification } })
    ctx.status = 204
  },
  async verifyPin (ctx) {
    const { body: data } = ctx.request
    ctx.body = await TravelersLogic.verifyPin(data)
  },
  async list (ctx) {
    const { query } = ctx
    ctx.body = await TravelersLogic.list(query)
  },
  async details (ctx) {
    const { id } = ctx.params
    const { query } = ctx
    ctx.body = await TravelersLogic.details({ id, query })
  },
  async batchDetails (ctx) {
    const { body: data } = ctx.request
    ctx.body = await TravelersLogic.batchDetails(data)
  },
  async batchFind (ctx) {
    const { body: data } = ctx.request
    // ODM has batchFind method, we shouldn't overwrite it
    ctx.body = await TravelerModel.batchFilter(data)
  },
  async setAvatar (ctx) {
    const { id } = ctx.params
    const { avatar } = ctx.request.body
    const traveler = await TravelerModel.get(id)
    if (traveler.doc.state === StateEnum.deleted) throw Oops.notAcceptable('The traveler is deleted.')
    ctx.body = await (await traveler.setAvatar(avatar)).update({ mask: TravelerModel.prototype._mask() })
  },
  async update (ctx) {
    const { id } = ctx.params
    const { body: data } = ctx.request
    ctx.body = await TravelersLogic.update({ id, data })
  },
  async login (ctx) {
    const { body: data } = ctx.request
    ctx.body = await TravelersLogic.login(data)
  },
  async deactivate (ctx) {
    const { id } = ctx.params
    const traveler = await TravelerModel.get(id)
    if (traveler.doc.state === StateEnum.deleted) throw Oops.notAcceptable('The traveler is deleted.')
    ctx.body = await traveler.assign({ state: StateEnum.frozen }).update()
  },
  async remove (ctx) {
    const { id } = ctx.params
    ctx.body = await TravelersLogic.remove(id)
    ctx.status = 204
  },
  async find (ctx) {
    const { email } = ctx.query
    const travelerEmail = await TravelerEmailModel.getByEmail(email)
    const traveler = await TravelerModel.get(travelerEmail.doc.travelerId)
    ctx.body = traveler.mask()
  },
  async getVerification (ctx) {
    const { email } = ctx.query
    const travelerEmail = await TravelerEmailModel.getByEmail(email)
    ctx.body = travelerEmail.doc.verification
  },
  async getVerificationStatus (ctx) {
    const { id: travelerId } = ctx.params
    const travelerEmail = await TravelerEmailModel.getByTravelerId(travelerId)
    let status
    if (travelerEmail.verification.verifiedAt) status = VerificationStatusEnum.verified
    else {
      if (travelerEmail.verification.expiresAt && Moment().isAfter(travelerEmail.verification.expiresAt)) {
        status = VerificationStatusEnum.codeIsExpired
      } else status = VerificationStatusEnum.notVerified
    }
    ctx.body = { status }
  },
  async updateHealth (ctx) {
    const { id: travelerId } = ctx.params
    const { body: data } = ctx.request
    data.travelerId = travelerId
    ctx.body = await TravelersLogic.updateHealth(data)
  },
  async acceptTerms (ctx) {
    const { id } = ctx.params
    const { body: data } = ctx.request
    data.travelerId = id
    await AcceptedTermModel.createOrOverwrite(data)
    ctx.status = 204
  }
})

export default Controllers

import { Oops } from '@gokiteam/oops'

const Controllers = ({
  ApplicationConfig: Config,
  AccessModel,
  TravelerModel,
  PubSubPublishHelper
}) => ({
  async createOrOverwrite (ctx) {
    const { body: data } = ctx.request
    await TravelerModel.get(data.travelerId) // This checks if traveler exists
    const access = await AccessModel.createOrOverwrite(data)
    ctx.body = access
    PubSubPublishHelper.publish({ topic: Config.pubSub.topics.travelerAccessRequested, data: { access } })
  },
  async list (ctx) {
    const { filter = {} } = ctx.query
    ctx.body = await AccessModel.listAll(filter)
  },
  async accept (ctx) {
    const { id: accessId } = ctx.params
    const { travelerId } = ctx.request.body
    const access = await AccessModel.get(accessId)
    if (travelerId !== access.doc.travelerId) throw Oops.notFound('Access request not found')
    ctx.body = await access.accept().update()
  },
  async deny (ctx) {
    const { id: accessId } = ctx.params
    const { travelerId } = ctx.request.body
    const access = await AccessModel.get(accessId)
    if (travelerId !== access.doc.travelerId) throw Oops.notFound('Access request not found')
    ctx.body = await access.deny().update()
  }
})

export default Controllers

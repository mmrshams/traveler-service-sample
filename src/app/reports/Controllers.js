// This sample module includes all controller middleware related to travelers resource endpoints

const Controllers = ({
  ReportsLogic
}) => ({
  async createOrUpdate (ctx) {
    const { body: data } = ctx.request
    await ReportsLogic.createOrUpdate(data)
    ctx.status = 204
  },
  async list (ctx) {
    const { query } = ctx
    ctx.body = await ReportsLogic.list(query)
  }
})

export default Controllers

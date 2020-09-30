const Controllers = ({ TravelerCopiesLogic }) => ({
  async list (ctx) {
    const { query } = ctx
    ctx.body = await TravelerCopiesLogic.list(query)
  }
})

export default Controllers

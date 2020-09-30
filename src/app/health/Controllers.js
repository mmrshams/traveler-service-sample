import Moment from 'moment'

let readinessCheckIntervalMinutes = 10
let lastReadinessCheckTime = Moment().subtract(2 * readinessCheckIntervalMinutes, 'minute').format()
let lastReadinessResponse = {}

const Controllers = ({ HealthLogic }) => ({
  async checkReadiness (ctx) {
    try {
      //  Here we check topics, subscriptions and configs healthiness and if there was any issue we should
      //  log an error which will be used to define monitoring metrics and alerts
      //  This API always returns 200 status
      //  The readiness check will be done once in 5 minutes
      if (Moment().subtract(readinessCheckIntervalMinutes, 'minute').isAfter(Moment(lastReadinessCheckTime))) {
        lastReadinessResponse = await HealthLogic.checkReadiness()
        lastReadinessResponse.at = lastReadinessCheckTime
        lastReadinessCheckTime = Moment().format()
      }
      ctx.status = 200
      ctx.body = lastReadinessResponse
    } catch (error) {
      HealthLogic.logReadinessFailed({ error })
      ctx.status = 204
    }
  },
  async checkLiveness (ctx) {
    try {
      // TODO: This should check pubsub subscribers healthiness and everything which can be resolved by service restart
      ctx.status = 204
    } catch (error) {
      ctx.status = 204
    }
  }
})

export default Controllers

import Joi from 'joi'

const ReservationMainCustomerUpdated = ({
  ApplicationConfig: Config,
  PubSubSubscriberWithRedis,
  CreateTravelerCopyLogic
}) => {
  return class extends PubSubSubscriberWithRedis {
    constructor () {
      super(Config.pubSub.subscribers.reservationMainCustomerUpdated)
    }

    get schema () {
      return Joi.object().unknown().keys({
        reservationId: Joi.string().required()
      })
    }

    async process ({ reservationId }) {
      const data = await CreateTravelerCopyLogic({ reservationId })
      return { state: this.resultStates.processedSuccessfully, data }
    }
  }
}

export default ReservationMainCustomerUpdated

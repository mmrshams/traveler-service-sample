import Joi from 'joi'
import { Oops } from '@gokiteam/oops'

const TravelerInfoNeeded = ({
  ApplicationConfig: Config,
  PubSubSubscriberWithRedis,
  TravelerEmailModel,
  TravelerModel,
  PubSubPublishHelper
}) => {
  return class extends PubSubSubscriberWithRedis {
    constructor () {
      super(Config.pubSub.subscribers.travelerInfoNeeded)
    }

    get schema () {
      return Joi.object().unknown().keys({
        reservationId: Joi.string().required(),
        email: Joi.string().email().required()
      })
    }

    async process ({ reservationId, email }) {
      try {
        const travelerEmail = await TravelerEmailModel.getByEmail(email)
        const traveler = await TravelerModel.find(travelerEmail.doc.travelerId)
        await PubSubPublishHelper
          .publish({ topic: Config.pubSub.topics.travelerInfoFound, data: { reservationId, traveler } })
      } catch (error) {
        // in case which the email isn't registered yet, the process should be passed
        if (error.isOops && error.data.code === Oops.errorCodes().NOT_FOUND) {
          return { state: this.resultStates.travelerNotFound }
        }
        throw error
      }
      return { state: this.resultStates.processedSuccessfully }
    }
  }
}

export default TravelerInfoNeeded

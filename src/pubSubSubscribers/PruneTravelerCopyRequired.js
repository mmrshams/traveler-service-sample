import Joi from 'joi'

const PruneTravelerCopyRequired = ({
  ApplicationConfig: Config,
  PubSubSubscriberWithRedis,
  TravelerCopyModel,
  PubSubPublishHelper
}) => {
  return class extends PubSubSubscriberWithRedis {
    constructor () {
      super(Config.pubSub.subscribers.pruneTravelerCopyRequired)
    }

    get schema () {
      return Joi.object().unknown().keys({
        travelerCopyId: Joi.string().required(),
        email: Joi.string().email().required(),
        hostelId: Joi.string().required()
      })
    }

    async process ({ travelerCopyId, email, hostelId }) {
      const travelerCopy = await TravelerCopyModel.get(travelerCopyId)
      await TravelerCopyModel.remove(travelerCopy.id)
      PubSubPublishHelper.publish({ topic: Config.pubSub.topics.travelerCopyRemoved,
        data: { traveler: { email, hostelId } }
      })
      return { state: this.resultStates.processedSuccessfully }
    }
  }
}

export default PruneTravelerCopyRequired

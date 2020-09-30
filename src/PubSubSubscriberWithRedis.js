import { SubscriberWithRedis } from '@gokiteam/pubsub'
import Joi from 'joi'

const PubSubSubscriberWithRedis = ({
  ApplicationConfig: Config,
  DefaultConfig: Default
}) => {
  const { projectId, keyFilename, deadLetterTopicName, subscriberResultsTopicName } = Config.pubSub
  const { subscriberOptions } = Default.pubSub
  const isTestEnvironment = Config.environment.startsWith('test')
  return class extends SubscriberWithRedis {
    constructor (props) {
      super({
        pubSubClientConfig: { projectId, keyFilename },
        redisClientOptions: Config.cache,
        subscriberOptions,
        deadLetterTopicName,
        ...isTestEnvironment && { subscriberResultsTopicName },
        ...isTestEnvironment && { maxTriesOnFailure: 0 },
        ...props
      })
    }

    get resultStates () {
      return Object.freeze({
        processedSuccessfully: 'processedSuccessfully',
        reservationTermsIsMissing: 'reservationTermsIsMissing',
        travelerNotFound: 'travelerNotFound',
        travelerEmailNotFound: 'travelerEmailNotFound'
      })
    }

    isDataValid (data) {
      if (this.schema) {
        const { error } = Joi.validate(data, this.schema)
        return { valid: !error, error }
      }
      return { valid: true }
    }
  }
}

export default PubSubSubscriberWithRedis

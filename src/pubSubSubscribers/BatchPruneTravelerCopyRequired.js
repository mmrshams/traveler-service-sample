const BatchPruneTravelerCopyRequired = ({
  ApplicationConfig: Config,
  PubSubSubscriberWithRedis,
  BatchPruneTravelerCopyRequiredLogic
}) => {
  return class extends PubSubSubscriberWithRedis {
    constructor () {
      super(Config.pubSub.subscribers.batchPruneTravelerCopyRequired)
    }

    async process () {
      await BatchPruneTravelerCopyRequiredLogic()
      return { state: this.resultStates.processedSuccessfully }
    }
  }
}

export default BatchPruneTravelerCopyRequired

import { Publisher, PublisherEventsWinstonLogger } from '@gokiteam/pubsub'

const PubSubPublish = ({
  ApplicationConfig: Config,
  LoggerHelper
}) => {
  const { projectId, keyFilename } = Config.pubSub
  const publisher = new Publisher({ projectId, keyFilename })
  PublisherEventsWinstonLogger.logger = LoggerHelper
  PublisherEventsWinstonLogger.register(publisher)
  return publisher
}

export default PubSubPublish

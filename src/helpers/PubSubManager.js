import { PubSubManager as PubSubManagerClass } from '@gokiteam/pubsub'

const PubSubManager = ({
  ApplicationConfig: Config
}) => {
  const { projectId, keyFilename } = Config.pubSub
  const pubSubManager = new PubSubManagerClass({ projectId, keyFilename })
  return pubSubManager
}

export default PubSubManager

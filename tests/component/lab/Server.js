const { Server } = require('@gokiteam/lab')

const customRoutes = require('./customRoutes/Index')
const { cache, pubSub } = require('../../configs/Application')

const server = new Server({
  port: 8998,
  customRoutes,
  pubSubResultsSubscriberOptions: {
    pubSubClientConfig: {
      projectId: pubSub.projectId,
      keyFilename: pubSub.keyFilename
    },
    redisClientOptions: cache,
    topicName: pubSub.subscriberResultsTopicName,
    subscriptionName: pubSub.subscriberResultsSubscriptionName
  }
})

server.start()

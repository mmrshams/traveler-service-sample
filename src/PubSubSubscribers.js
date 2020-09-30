import { readdirSync } from 'fs'
import { SubscriberEventsWinstonLogger } from '@gokiteam/pubsub'
// Loading pub/sub subscribers automatically from PubSubSubscribers folder.

const privates = {
  getSubscriberNames: () => {
    const files = readdirSync(`${__dirname}/pubSubSubscribers`)
    let getSubscriberNames = []
    files.forEach(filename => {
      const [name, ext] = filename.split('.')
      if (ext === 'js') {
        getSubscriberNames.push(`${name}PubSubSubscriber`)
      }
    })
    return getSubscriberNames
  }
}

const Subscribers = (opts) => ({
  async load () {
    const subscriberNames = privates.getSubscriberNames()
    const subscriberClasses = subscriberNames.map(subscriberName => opts[subscriberName])
    const promises = subscriberClasses.map(SubscriberClass => {
      const subscriber = new SubscriberClass()
      SubscriberEventsWinstonLogger.logger = opts.LoggerHelper
      SubscriberEventsWinstonLogger.register(subscriber)
      return subscriber.subscribe()
    })
    await Promise.all(promises)
    return true
  }
})

export default Subscribers

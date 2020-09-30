const {
  NODE_ENV,
  SERVER_PORT,
  HOSTELS_SERVER_HOST,
  HOSTELS_SERVER_PROTOCOL,
  CACHE_HOST,
  CACHE_PORT,
  LOG_LEVEL,
  FIRESTORE_PROJECT_ID,
  FIRESTORE_KEY_FILE_NAME,
  ELASTIC_CLOUD_ID,
  ELASTIC_CLOUD_USERNAME,
  ELASTIC_CLOUD_PASSWORD,
  PUB_SUB_PROJECT_ID,
  PUB_SUB_KEY_FILE_NAME,
  ROLLBAR_ENABLED,
  ROLLBAR_ACCESS_TOKEN,
  ODM_ANALYTICS_ENABLED,
  ODM_ANALYTICS_GLOBALLY_ENABLED,
  PUB_SUB_TOPIC_TRAVELER_INFO_NEEDED,
  PUB_SUB_TOPIC_MESSAGE_DEAD_LETTERED,
  PUB_SUB_SUBSCRIPTION_TRAVELER_INFO_NEEDED,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  PUB_SUB_SUBSCRIPTION_BATCH_PRUNE_TRAVELER_COPY_REQUIRED,
  PUB_SUB_TOPIC_BATCH_PRUNE_TRAVELER_COPY_REQUIRED,
  PUB_SUB_SUBSCRIPTION_PRUNE_TRAVELER_COPY_REQUIRED,
  PUB_SUB_TOPIC_PRUNE_TRAVELER_COPY_REQUIRED,
  PUB_SUB_SUBSCRIPTION_RESERVATION_CLAIMED,
  PUB_SUB_TOPIC_RESERVATION_CLAIMED,
  PUB_SUB_TOPIC_RESERVATION_MAIN_CUSTOMER_UPDATED,
  PUB_SUB_SUBSCRIPTION_RESERVATION_MAIN_CUSTOMER_UPDATED,
  PUB_SUB_SUBSCRIBER_RESULTS_TOPIC_NAME,
  PUB_SUB_SUBSCRIBER_RESULTS_SUBSCRIPTION_NAME
} = process.env

const configs = {
  logLevel: LOG_LEVEL,
  environment: NODE_ENV,
  server: {
    port: SERVER_PORT,
    host: HOSTELS_SERVER_HOST || 'localhost',
    protocol: HOSTELS_SERVER_PROTOCOL || 'http',
    base: null // calculative value: please check below for the value
  },
  cache: {
    host: CACHE_HOST,
    port: parseInt(CACHE_PORT)
  },
  firestore: {
    projectId: FIRESTORE_PROJECT_ID,
    keyFilename: FIRESTORE_KEY_FILE_NAME
  },
  elastic: {
    cloud: {
      id: ELASTIC_CLOUD_ID,
      username: ELASTIC_CLOUD_USERNAME,
      password: ELASTIC_CLOUD_PASSWORD
    }
  },
  odm: {
    analytics: {
      enabled: ODM_ANALYTICS_ENABLED === 'true' && ODM_ANALYTICS_GLOBALLY_ENABLED === 'true'
    }
  },
  cloudinary: {
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
  },
  pubSub: {
    projectId: PUB_SUB_PROJECT_ID,
    keyFilename: PUB_SUB_KEY_FILE_NAME,
    deadLetterTopicName: PUB_SUB_TOPIC_MESSAGE_DEAD_LETTERED,
    subscriberResultsTopicName: PUB_SUB_SUBSCRIBER_RESULTS_TOPIC_NAME,
    subscriberResultsSubscriptionName: PUB_SUB_SUBSCRIBER_RESULTS_SUBSCRIPTION_NAME,
    subscribers: {
      travelerInfoNeeded: {
        subscriptionName: PUB_SUB_SUBSCRIPTION_TRAVELER_INFO_NEEDED,
        topicName: PUB_SUB_TOPIC_TRAVELER_INFO_NEEDED
      },
      batchPruneTravelerCopyRequired: {
        subscriptionName: PUB_SUB_SUBSCRIPTION_BATCH_PRUNE_TRAVELER_COPY_REQUIRED,
        topicName: PUB_SUB_TOPIC_BATCH_PRUNE_TRAVELER_COPY_REQUIRED
      },
      pruneTravelerCopyRequired: {
        subscriptionName: PUB_SUB_SUBSCRIPTION_PRUNE_TRAVELER_COPY_REQUIRED,
        topicName: PUB_SUB_TOPIC_PRUNE_TRAVELER_COPY_REQUIRED
      },
      reservationClaimed: {
        subscriptionName: PUB_SUB_SUBSCRIPTION_RESERVATION_CLAIMED,
        topicName: PUB_SUB_TOPIC_RESERVATION_CLAIMED
      },
      reservationMainCustomerUpdated: {
        subscriptionName: PUB_SUB_SUBSCRIPTION_RESERVATION_MAIN_CUSTOMER_UPDATED,
        topicName: PUB_SUB_TOPIC_RESERVATION_MAIN_CUSTOMER_UPDATED
      }
    }
  },
  rollbar: {
    enabled: Boolean(ROLLBAR_ENABLED === 'true'),
    accessToken: ROLLBAR_ACCESS_TOKEN
  }
}

if (configs.environment === 'test-component') configs.envShortName = 'test_component'
else if (configs.environment === 'test-pact') configs.envShortName = 'test_pact'
else configs.envShortName = 'test'

configs.server.base = `${configs.server.protocol}://${configs.server.host}:${configs.server.port}`

module.exports = configs

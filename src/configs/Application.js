// Application configurations are read and joined together here

const Application = () => {
  const config = {}
  const {
    NODE_ENV,
    SERVER_PORT,
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
    PUB_SUB_TOPIC_TRAVELER_INFO_FOUND,
    PUB_SUB_TOPIC_TRAVELER_JOINED,
    PUB_SUB_TOPIC_TRAVELER_VERIFICATION_REQUIRED,
    PUB_SUB_TOPIC_TRAVELER_PIN_GENERATED,
    PUB_SUB_TOPIC_TRAVELER_ACCESS_REQUESTED,
    PUB_SUB_TOPIC_TRAVELER_INFO_NEEDED,
    PUB_SUB_TOPIC_MESSAGE_DEAD_LETTERED,
    PUB_SUB_SUBSCRIPTION_TRAVELER_INFO_NEEDED,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    PUB_SUB_TOPIC_TRAVELER_REMOVED,
    PUB_SUB_TOPIC_TRAVELER_HEALTH_STATE_CHANGED,
    PUB_SUB_TOPIC_BATCH_TRAVELER_COPY_REMOVED,
    PUB_SUB_SUBSCRIPTION_BATCH_PRUNE_TRAVELER_COPY_REQUIRED,
    PUB_SUB_TOPIC_BATCH_PRUNE_TRAVELER_COPY_REQUIRED,
    PUB_SUB_SUBSCRIPTION_PRUNE_TRAVELER_COPY_REQUIRED,
    PUB_SUB_TOPIC_PRUNE_TRAVELER_COPY_REQUIRED,
    PUB_SUB_TOPIC_TRAVELER_COPY_REMOVED,
    PUB_SUB_SUBSCRIPTION_RESERVATION_CLAIMED,
    PUB_SUB_TOPIC_RESERVATION_CLAIMED,
    PUB_SUB_TOPIC_RESERVATION_MAIN_CUSTOMER_UPDATED,
    PUB_SUB_SUBSCRIPTION_RESERVATION_MAIN_CUSTOMER_UPDATED,
    PUB_SUB_SUBSCRIBER_RESULTS_TOPIC_NAME
  } = process.env

  config.environment = NODE_ENV || 'development'
  config.envShortName = 'dev'
  if (config.environment === 'production') config.envShortName = 'prd'
  else if (config.environment === 'staging') config.envShortName = 'stg'
  else if (config.environment === 'test-component') config.envShortName = 'test_component'
  else if (config.environment === 'test-pact') config.envShortName = 'test_pact'
  else if (config.environment === 'test') config.envShortName = 'test'
  config.logLevel = LOG_LEVEL || 'info'
  config.server = { port: parseInt(SERVER_PORT) }
  config.cache = { host: CACHE_HOST, port: parseInt(CACHE_PORT) }
  config.firestore = {}
  config.firestore.projectId = FIRESTORE_PROJECT_ID
  config.firestore.keyFilename = FIRESTORE_KEY_FILE_NAME
  config.elastic = {}
  config.elastic.cloud = {}
  config.elastic.cloud.id = ELASTIC_CLOUD_ID
  config.elastic.cloud.username = ELASTIC_CLOUD_USERNAME
  config.elastic.cloud.password = ELASTIC_CLOUD_PASSWORD
  config.odm = {}
  config.odm.analytics = {
    enabled: ODM_ANALYTICS_ENABLED === 'true' && ODM_ANALYTICS_GLOBALLY_ENABLED === 'true'
  }
  config.cloudinary = {}
  config.cloudinary.cloud_name = CLOUDINARY_CLOUD_NAME
  config.cloudinary.api_key = CLOUDINARY_API_KEY
  config.cloudinary.api_secret = CLOUDINARY_API_SECRET
  config.pubSub = {}
  config.pubSub.projectId = PUB_SUB_PROJECT_ID
  config.pubSub.keyFilename = PUB_SUB_KEY_FILE_NAME
  config.pubSub.deadLetterTopicName = PUB_SUB_TOPIC_MESSAGE_DEAD_LETTERED
  config.pubSub.subscriberResultsTopicName = PUB_SUB_SUBSCRIBER_RESULTS_TOPIC_NAME
  config.pubSub.topics = {
    travelerInfoFound: PUB_SUB_TOPIC_TRAVELER_INFO_FOUND,
    travelerJoined: PUB_SUB_TOPIC_TRAVELER_JOINED,
    travelerVerificationRequired: PUB_SUB_TOPIC_TRAVELER_VERIFICATION_REQUIRED,
    travelerPinGenerated: PUB_SUB_TOPIC_TRAVELER_PIN_GENERATED,
    travelerAccessRequested: PUB_SUB_TOPIC_TRAVELER_ACCESS_REQUESTED,
    travelerRemoved: PUB_SUB_TOPIC_TRAVELER_REMOVED,
    travelerHealthStateChanged: PUB_SUB_TOPIC_TRAVELER_HEALTH_STATE_CHANGED,
    batchTravelerCopyRemoved: PUB_SUB_TOPIC_BATCH_TRAVELER_COPY_REMOVED,
    pruneTravelerCopyRequired: PUB_SUB_TOPIC_PRUNE_TRAVELER_COPY_REQUIRED,
    batchPruneTravelerCopyRequired: PUB_SUB_TOPIC_BATCH_PRUNE_TRAVELER_COPY_REQUIRED,
    travelerCopyRemoved: PUB_SUB_TOPIC_TRAVELER_COPY_REMOVED
  }
  config.pubSub.subscribers = {
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
  config.rollbar = {
    enabled: Boolean(ROLLBAR_ENABLED === 'true'),
    accessToken: ROLLBAR_ACCESS_TOKEN
  }
  return config
}

export default Application

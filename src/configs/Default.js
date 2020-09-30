// Default values are read and joined together here

const Default = () => {
  const config = {}
  const {
    PAGE_OFFSET,
    PAGE_LIMIT,
    RED_LOCK_RETRY_DELAY,
    RED_LOCK_RETRY_COUNT,
    REPORT_NEED_REVIEW_THRESHOLD,
    MAX_IDS_SIZE,
    PUB_SUB_GLOBAL_SUBSCRIBER_OPTIONS,
    KEEP_DELETED_TRAVELER_COPIES_THRESHOLD_DAYS,
    DISTANCE_CLOSE,
    DISTANCE_FAR,
    TAG_LIST
  } = process.env

  config.page = Object.freeze({
    offset: parseInt(PAGE_OFFSET),
    limit: parseInt(PAGE_LIMIT)
  })

  config.distance = Object.freeze({
    close: DISTANCE_CLOSE,
    far: DISTANCE_FAR
  })
  config.maxIdsSize = Math.abs(parseInt(MAX_IDS_SIZE))
  config.pubSub = {
    subscriberOptions: JSON.parse(PUB_SUB_GLOBAL_SUBSCRIBER_OPTIONS)
  }
  config.redLock = {
    driftFactor: 0.01, // time in ms
    retryCount: parseInt(RED_LOCK_RETRY_COUNT),
    retryDelay: parseInt(RED_LOCK_RETRY_DELAY),
    retryJitter: 200 // time in ms
  }
  config.report = {
    needReviewThreshold: parseInt(REPORT_NEED_REVIEW_THRESHOLD)
  }
  config.tagList = JSON.parse(TAG_LIST)
  config.traveler = {
    keepDeletedCopiesThresholdDays: parseInt(KEEP_DELETED_TRAVELER_COPIES_THRESHOLD_DAYS)
  }
  return config
}

export default Default

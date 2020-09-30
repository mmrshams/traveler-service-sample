const { messageProcessingFailed } = require('../constants/PubSubSubscriberEvents')

const PublishAndCollectWrapper = async (chai, baseUrl, topic, data = {}) => {
  const result = await chai.request(baseUrl).post('/publishAndCollect').send({ topic, ...data })
  if (result.body.error) {
    result.body.data = {
      event: messageProcessingFailed,
      result: false,
      message: {
        data: null
      }
    }
  }
  return result.body
}

module.exports = PublishAndCollectWrapper

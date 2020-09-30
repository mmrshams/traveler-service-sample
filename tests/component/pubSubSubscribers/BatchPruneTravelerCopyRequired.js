const Mocha = require('mocha')
const Chai = require('chai')
const ChaiHttp = require('chai-http')
const Configs = require('../../configs/Application')
const BaseUrls = require('../../configs/BaseUrls')
const Firestore = require('../../datastore/Firestore')
const PublishAndCollectWrapper = require('../../helpers/PublishAndCollectWrapper')
const TravelerCopy = require('../../mockModels/TravelerCopy')

const { describe, beforeEach, after, it } = Mocha
const { expect } = Chai
const firestore = new Firestore()

Chai.use(ChaiHttp)

const topic = Configs.pubSub.subscribers.batchPruneTravelerCopyRequired.topicName

describe('Publishing message on "BatchPruneTravelerCopyRequired"', () => {
  let publish
  beforeEach(async () => {
    publish = async (data = {}) => PublishAndCollectWrapper(Chai, BaseUrls.lab, topic, data)
  })

  after(async () => {
    await firestore.cleanup()
  })

  describe('When correct parameters are passed', () => {
    it('The processing of the message must succeed', async () => {
      const travelerCopy = new TravelerCopy()
      await firestore.create([travelerCopy])
      const { data: { result: { state } } } = await publish({ data: {} })
      expect(state).to.equal('processedSuccessfully')
    })
  })
})

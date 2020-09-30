const Mocha = require('mocha')
const Chai = require('chai')
const ChaiHttp = require('chai-http')
const Configs = require('../../configs/Application')
const BaseUrls = require('../../configs/BaseUrls')
const Firestore = require('../../datastore/Firestore')
const PublishAndCollectWrapper = require('../../helpers/PublishAndCollectWrapper')
const ModelsMustNotPersist = require('../../helpers/ModelsMustNotPersist')
const Traveler = require('../../mockModels/Traveler')
const TravelerCopy = require('../../mockModels/TravelerCopy')

const { describe, beforeEach, after, it } = Mocha
const { expect } = Chai
const firestore = new Firestore()

Chai.use(ChaiHttp)

const topic = Configs.pubSub.subscribers.pruneTravelerCopyRequired.topicName

describe('Publishing message on "PruneTravelerCopyRequired"', () => {
  let publish
  beforeEach(async () => {
    publish = async (data = {}) => PublishAndCollectWrapper(Chai, BaseUrls.lab, topic, data)
  })

  after(async () => {
    await firestore.cleanup()
  })

  describe('When correct parameters are passed', () => {
    it('The processing of the message must succeed', async () => {
      const traveler = new Traveler({ state: 'active' })
      const travelerCopy = new TravelerCopy({ travelerId: traveler.id })
      const fields = {
        travelerCopyId: travelerCopy.id,
        email: traveler.data.email,
        hostelId: '1234567890'
      }
      await firestore.create([traveler, travelerCopy])
      const { data: { result: { state } } } = await publish({ data: fields })
      expect(state).to.equal('processedSuccessfully')
      const removedTravelerCopy = await Firestore.getByModel(travelerCopy)
      ModelsMustNotPersist([removedTravelerCopy])
    })
  })

  describe('When traveler copy does not exist', () => {
    it('The processing of the message must fail with event value set as "messageProcessingFailed"', async () => {
      const traveler = new Traveler({ state: 'active' })
      const travelerCopy = new TravelerCopy({ travelerId: traveler.id })
      const fields = {
        travelerCopyId: travelerCopy.id,
        email: traveler.data.email,
        hostelId: '1234567890'
      }
      await firestore.create([traveler])
      const { data: { event } } = await publish({ data: fields })
      expect(event).to.equal('messageProcessingFailed')
    })
  })
})

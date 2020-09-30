const Mocha = require('mocha')
const Chai = require('chai')
const ChaiHttp = require('chai-http')
const Configs = require('../../configs/Application')
const BaseUrls = require('../../configs/BaseUrls')
const Firestore = require('../../datastore/Firestore')
const PublishAndCollectWrapper = require('../../helpers/PublishAndCollectWrapper')
const ModelsMustPersist = require('../../helpers/ModelsMustPersist')
const Traveler = require('../../mockModels/Traveler')
const TravelerCopy = require('../../mockModels/TravelerCopy')

const { describe, beforeEach, after, it } = Mocha
const { expect } = Chai
const firestore = new Firestore()

Chai.use(ChaiHttp)

const topic = Configs.pubSub.subscribers.reservationMainCustomerUpdated.topicName

describe('Publishing message on "ReservationMainCustomerUpdated"', () => {
  let publish
  beforeEach(async () => {
    publish = async (data = {}) => PublishAndCollectWrapper(Chai, BaseUrls.lab, topic, data)
  })

  after(async () => {
    await firestore.cleanup()
  })

  describe('When correct parameters are passed', () => {
    it('The processing of the message must succeed', async () => {
      const traveler = new Traveler()
      const fields = { reservationId: `guest:${traveler.id}` }
      await firestore.create([traveler])
      const { data: { result: { state, data } } } = await publish({ data: fields })
      expect(state).to.equal('processedSuccessfully')
      const travelerCopy = await Firestore.getByModel(new TravelerCopy({ id: data.id }))
      ModelsMustPersist([travelerCopy])
    })
  })

  describe('When reservation is wrong', () => {
    it('The processing of the message must fail with event value set as "messageProcessingFailed"', async () => {
      const fields = { reservationId: `wrong` }
      const { data: { event } } = await publish({ data: fields })
      expect(event).to.equal('messageProcessingFailed')
    })
  })

  describe('When reservation is wrong', () => {
    it('The processing of the message must fail with event value set as "messageDataIsNotValid"', async () => {
      const { data: { event } } = await publish({ data: {} })
      expect(event).to.equal('messageDataIsNotValid')
    })
  })
})

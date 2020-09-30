const Mocha = require('mocha')
const Chai = require('chai')
const ChaiHttp = require('chai-http')
const Configs = require('../../configs/Application')
const BaseUrls = require('../../configs/BaseUrls')
const Firestore = require('../../datastore/Firestore')
const PublishAndCollectWrapper = require('../../helpers/PublishAndCollectWrapper')
const GenerateCombinations = require('../../helpers/GenerateCombinations')
const Traveler = require('../../mockModels/Traveler')
const TravelerEmail = require('../../mockModels/TravelerEmail')

const { describe, beforeEach, after, it } = Mocha
const { expect } = Chai
const firestore = new Firestore()

Chai.use(ChaiHttp)

const topic = Configs.pubSub.subscribers.travelerInfoNeeded.topicName

describe('Publishing message on "TravelerInfoNeeded"', () => {
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
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
      const fields = { reservationId: '0', email: traveler.data.email }
      await firestore.create([traveler, travelerEmail])
      const { data: { result: { state } } } = await publish({ data: fields })
      expect(state).to.equal('processedSuccessfully')
    })
  })

  describe('When traveler email does not exist', () => {
    it('The processing of the message must fail and status must be equal to "travelerNotFound"', async () => {
      const traveler = new Traveler({ state: 'active' })
      const fields = { reservationId: '0', email: traveler.data.email }
      await firestore.create([traveler])
      const { data: { result: { state } } } = await publish({ data: fields })
      expect(state).to.equal('travelerNotFound')
    })
  })

  describe('When traveler does not exist', () => {
    it('The processing of the message must fail and status must be equal to "travelerNotFound"', async () => {
      const traveler = new Traveler({ state: 'active' })
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
      const fields = { reservationId: '0', email: traveler.data.email }
      await firestore.create([travelerEmail])
      const { data: { result: { state } } } = await publish({ data: fields })
      expect(state).to.equal('travelerNotFound')
    })
  })

  describe('When any of the required fields are missing', () => {
    it('The processing of the message must fail with state set to "messageDataIsNotValid"', async () => {
      const fields = { reservationId: '0', email: 'some@email.com' }
      const combinations = GenerateCombinations(fields)
      for (const combination of combinations) {
        const { data: { event } } = await publish({ data: combination })
        expect(event).to.equal('messageDataIsNotValid')
      }
    })
  })
})

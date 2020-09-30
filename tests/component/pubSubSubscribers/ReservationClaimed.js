const Mocha = require('mocha')
const Chai = require('chai')
const ChaiHttp = require('chai-http')
const Configs = require('../../configs/Application')
const BaseUrls = require('../../configs/BaseUrls')
const Firestore = require('../../datastore/Firestore')
const PublishAndCollectWrapper = require('../../helpers/PublishAndCollectWrapper')
const Retry = require('../../helpers/Retry')
const ModelsMustPersist = require('../../helpers/ModelsMustPersist')
const GenerateCombinations = require('../../helpers/GenerateCombinations')
const Traveler = require('../../mockModels/Traveler')
const AcceptedTerm = require('../../mockModels/AcceptedTerm')

const { describe, beforeEach, after, it } = Mocha
const { expect } = Chai
const firestore = new Firestore()

Chai.use(ChaiHttp)

const topic = Configs.pubSub.subscribers.reservationClaimed.topicName

describe('Publishing message on "ReservationClaimed"', () => {
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
      const fields = { reservationId: traveler.data.email, guestId: traveler.id }
      await firestore.create([traveler])
      await Retry(async () => {
        const { data: { result: { state, data } } } = await publish({ data: fields, timeout: 15000 })
        if (state !== 'processedSuccessfully') return false
        const acceptedTerm = await Firestore.getByModel(
          new AcceptedTerm({ hostelId: data.hostelId, travelerId: data.travelerId }))
        ModelsMustPersist([acceptedTerm])
      })
    })
  })

  describe('When reservation terms is missing', () => {
    it('The processing of the message must fail with state set to "reservationTermsIsMissing"', async () => {
      const traveler = new Traveler({ state: 'active' })
      const fields = { reservationId: 'no-terms', guestId: traveler.id }
      await firestore.create([traveler])
      const { data: { result: { state } } } = await publish({ data: fields })
      expect(state).to.equal('reservationTermsIsMissing')
    })
  })

  describe('When traveler does not exist', () => {
    it('The processing of the message must fail with state set to "reservationTermsIsMissing"', async () => {
      const traveler = new Traveler({ state: 'active' })
      const fields = { reservationId: 'no-traveler', guestId: traveler.id }
      await firestore.create([traveler])
      const { data: { result: { state } } } = await publish({ data: fields })
      expect(state).to.equal('travelerNotFound')
    })
  })

  describe('When traveler id is wrong', () => {
    it('The processing of the message must fail with state set to "reservationTermsIsMissing"', async () => {
      const traveler = new Traveler({ state: 'active' })
      const fields = { reservationId: 'no-traveler', guestId: 'WRONG' }
      await firestore.create([traveler])
      const { data: { event } } = await publish({ data: fields })
      expect(event).to.equal('messageProcessingFailed')
    })
  })

  describe('When any of the required fields are missing', () => {
    it('The processing of the message must fail with state set to "messageDataIsNotValid"', async () => {
      const fields = { reservationId: 'no-traveler', guestId: 'WRONG' }
      const combinations = GenerateCombinations(fields)
      for (const combination of combinations) {
        const { data: { event } } = await publish({ data: combination })
        expect(event).to.equal('messageDataIsNotValid')
      }
    })
  })
})

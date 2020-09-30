const Mocha = require('mocha')
const Chai = require('chai')
const ChaiHttp = require('chai-http')
const Firestore = require('../../../datastore/Firestore')
const Config = require('../../../configs/Application')
const Keys = require('../../../helpers/Keys')
const ObjectsMustEqual = require('../../../helpers/ObjectsMustEqual')
const GenerateCombinations = require('../../../helpers/GenerateCombinations')
const Traveler = require('../../../mockModels/Traveler')
const TravelerEmail = require('../../../mockModels/TravelerEmail')

const { describe, beforeEach, after, it } = Mocha
const { expect } = Chai
const firestore = new Firestore()
const apiVersion = '/v1'

Chai.use(ChaiHttp)

describe(`Calling POST /travelers/pin/verify`, () => {
  let request
  beforeEach(async () => {
    request = Chai.request(Config.server.base + apiVersion)
  })

  after(async () => {
    await firestore.cleanup()
  })

  describe('When required params are provided', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler({ state: 'active', health: 'clean' }).withHometown()
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
        .withVerification()
        .withRecovery()
      const fields = { email: traveler.data.email, pin: travelerEmail.data.recovery.pin }
      await firestore.create([traveler, travelerEmail])
      const { status, body: { data } } = await request.post('/travelers/pin/verify').send(fields)
      expect(status).to.equal(200)
      expect(data.auth).to.exist.which.is.a('string').and.not.empty
      ObjectsMustEqual({
        keys: Keys({ object: data, keys: ['auth'], exclude: true }),
        source: data,
        target: traveler.data
      })
    })
  })

  describe('When the email does not exist', () => {
    it('Must return status code 404', async () => {
      const traveler = new Traveler().withHometown()
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
        .withVerification({ verifiedAt: null, expiresAt: null })
        .withRecovery()
      const fields = { email: traveler.data.email, pin: travelerEmail.data.recovery.pin }
      await firestore.create([traveler])
      const { status } = await request.post('/travelers/pin/verify').send(fields)
      expect(status).to.equal(404)
    })
  })

  describe('When recovery data is missing', () => {
    it('Must return status code 401', async () => {
      const traveler = new Traveler().withHometown()
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
        .withVerification({ verifiedAt: null, expiresAt: null })
      const fields = { email: traveler.data.email, pin: '1234' }
      await firestore.create([traveler, travelerEmail])
      const { status } = await request.post('/travelers/pin/verify').send(fields)
      expect(status).to.equal(401)
    })
  })

  describe('When pin does not match and retried less than 3 times', () => {
    it('Must return status code 401', async () => {
      const traveler = new Traveler().withHometown()
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
        .withVerification()
        .withRecovery()
      const fields = { email: traveler.data.email, pin: '1234' }
      await firestore.create([traveler, travelerEmail])
      const { status } = await request.post('/travelers/pin/verify').send(fields)
      expect(status).to.equal(401)
    })
  })

  describe('When pin does not match and retried more than 3 times', () => {
    it('Must return status code 401', async () => {
      const traveler = new Traveler().withHometown()
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
        .withVerification()
        .withRecovery({ retried: 5 })
      const fields = { email: traveler.data.email, pin: '1234' }
      await firestore.create([traveler, travelerEmail])
      const { status } = await request.post('/travelers/pin/verify').send(fields)
      expect(status).to.equal(401)
    })
  })

  describe('When traveler is does not exist', () => {
    it('Must return status code 404', async () => {
      const traveler = new Traveler().withHometown()
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
        .withVerification()
        .withRecovery()
      const fields = { email: traveler.data.email, pin: travelerEmail.data.recovery.pin }
      await firestore.create([travelerEmail])
      const { status } = await request.post('/travelers/pin/verify').send(fields)
      expect(status).to.equal(404)
    })
  })

  describe('When any of the required fields are missing', () => {
    it('Must return status code 400', async () => {
      const fields = { email: 'some@email.com', pin: '1234' }
      const combinations = GenerateCombinations(fields)
      for (const combination of combinations) {
        const { status } = await request.post('/travelers/pin/verify').send(combination)
        expect(status).to.equal(400)
      }
    })
  })
})

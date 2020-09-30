const Mocha = require('mocha')
const Chai = require('chai')
const ChaiHttp = require('chai-http')
const Firestore = require('../../../datastore/Firestore')
const Config = require('../../../configs/Application')
const Traveler = require('../../../mockModels/Traveler')
const TravelerEmail = require('../../../mockModels/TravelerEmail')

const { describe, beforeEach, after, it } = Mocha
const { expect } = Chai
const firestore = new Firestore()
const apiVersion = '/v1'

Chai.use(ChaiHttp)

describe(`Calling POST /travelers/pin/generate`, () => {
  let request
  beforeEach(async () => {
    request = Chai.request(Config.server.base + apiVersion)
  })

  after(async () => {
    await firestore.cleanup()
  })

  describe('When required params are provided', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler({ health: 'clean' }).withHometown()
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
        .withVerification({ verifiedAt: null, expiresAt: null })
        .withRecovery()
      const fields = { email: traveler.data.email }
      await firestore.create([traveler, travelerEmail])
      const { status, body: { data } } = await request.post('/travelers/pin/generate').send(fields)
      expect(status).to.equal(200)
      expect(data.pin).to.exist.which.is.a('string').that.has.lengthOf(4)
    })
  })

  describe('When email does not exist', () => {
    it('Must return status code 404', async () => {
      const traveler = new Traveler({ health: 'clean' }).withHometown()
      const fields = { email: traveler.data.email }
      await firestore.create([traveler])
      const { status } = await request.post('/travelers/pin/generate').send(fields)
      expect(status).to.equal(404)
    })
  })

  describe('When traveler is does not exist', () => {
    it('Must return status code 404', async () => {
      const traveler = new Traveler({ health: 'clean' }).withHometown()
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
        .withVerification({ verifiedAt: null, expiresAt: null })
        .withRecovery()
      const fields = { email: traveler.data.email }
      await firestore.create([travelerEmail])
      const { status } = await request.post('/travelers/pin/generate').send(fields)
      expect(status).to.equal(404)
    })
  })

  describe('When health is set to "blocked"', () => {
    it('Must return status code 403', async () => {
      const traveler = new Traveler({ health: 'blocked' }).withHometown()
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
        .withVerification({ verifiedAt: null, expiresAt: null })
        .withRecovery()
      const fields = { email: traveler.data.email }
      await firestore.create([traveler, travelerEmail])
      const { status } = await request.post('/travelers/pin/generate').send(fields)
      expect(status).to.equal(403)
    })
  })

  describe('When email field is missing', () => {
    it('Must return status code 400', async () => {
      const traveler = new Traveler({ health: 'blocked' }).withHometown()
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
        .withVerification({ verifiedAt: null, expiresAt: null })
        .withRecovery()
      await firestore.create([traveler, travelerEmail])
      const { status } = await request.post('/travelers/pin/generate').send({})
      expect(status).to.equal(400)
    })
  })
})

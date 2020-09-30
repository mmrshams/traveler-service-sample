const Mocha = require('mocha')
const Chai = require('chai')
const ChaiHttp = require('chai-http')
const Moment = require('moment')
const Firestore = require('../../../datastore/Firestore')
const Config = require('../../../configs/Application')
const Traveler = require('../../../mockModels/Traveler')
const TravelerEmail = require('../../../mockModels/TravelerEmail')

const { describe, beforeEach, after, it } = Mocha
const { expect } = Chai
const firestore = new Firestore()
const apiVersion = '/v1'

Chai.use(ChaiHttp)

describe(`Calling GET /travelers/:id/verification/status`, () => {
  let request
  beforeEach(async () => {
    request = Chai.request(Config.server.base + apiVersion)
  })

  after(async () => {
    await firestore.cleanup()
  })

  describe('When required params are provided', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler()
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
        .withVerification()
      await firestore.create([traveler, travelerEmail])
      const { status, body: { data } } = await request
        .get(`/travelers/${traveler.id}/verification/status`)
      expect(status).to.equal(200)
      expect(data.status).to.equal('verified')
    })
  })

  describe('When verification is expired', () => {
    it('Must return status code 200 and returned status must equal "codeIsExpired" ', async () => {
      const traveler = new Traveler()
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
        .withVerification({
          verifiedAt: null,
          expiresAt: Moment().subtract(5, 'years').format()
        })
      await firestore.create([traveler, travelerEmail])
      const { status, body: { data } } = await request
        .get(`/travelers/${traveler.id}/verification/status`)
      expect(status).to.equal(200)
      expect(data.status).to.equal('codeIsExpired')
    })
  })

  describe('When is not verified', () => {
    it('Must return status code 200 and returned status must equal "notVerified"', async () => {
      const traveler = new Traveler()
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
        .withVerification({
          verifiedAt: null,
          expiresAt: Moment().add(5, 'years').format()
        })
      await firestore.create([traveler, travelerEmail])
      const { status, body: { data } } = await request
        .get(`/travelers/${traveler.id}/verification/status`)
      expect(status).to.equal(200)
      expect(data.status).to.equal('notVerified')
    })
  })

  describe('When reservation is does not exist', () => {
    it('Must return status code 404', async () => {
      const { status } = await request.get(`/travelers/0/verification/status`)
      expect(status).to.equal(404)
    })
  })
})

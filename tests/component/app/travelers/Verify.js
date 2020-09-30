const Mocha = require('mocha')
const Chai = require('chai')
const ChaiHttp = require('chai-http')
const Moment = require('moment')
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

describe(`Calling POST /travelers/verify`, () => {
  let request
  beforeEach(async () => {
    request = Chai.request(Config.server.base + apiVersion)
  })

  after(async () => {
    await firestore.cleanup()
  })

  describe('When required params are provided', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler().withHometown()
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
        .withVerification({ verifiedAt: null, expiresAt: null })
        .withRecovery()
      const fields = { email: traveler.data.email, verificationCode: travelerEmail.data.verification.code }
      await firestore.create([traveler, travelerEmail])
      const { status, body: { data } } = await request.post('/travelers/verify').send(fields)
      expect(status).to.equal(200)
      expect(data.auth).to.equal(travelerEmail.data.auth)
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
      const fields = { email: traveler.data.email, verificationCode: travelerEmail.data.verification.code }
      await firestore.create([traveler])
      const { status } = await request.post('/travelers/verify').send(fields)
      expect(status).to.equal(404)
    })
  })

  describe('When required params are provided', () => {
    it('Must return status code 406', async () => {
      const traveler = new Traveler().withHometown()
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
        .withVerification({ verifiedAt: null, expiresAt: null })
        .withRecovery()
      const fields = { email: traveler.data.email, verificationCode: 'WRONG' }
      await firestore.create([traveler, travelerEmail])
      const { status } = await request.post('/travelers/verify').send(fields)
      expect(status).to.equal(406)
    })
  })

  describe('When verification code is expired', () => {
    it('Must return status code 403', async () => {
      const traveler = new Traveler().withHometown()
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
        .withVerification({ verifiedAt: null, expiresAt: Moment().subtract(1, 'year').format() })
        .withRecovery()
      const fields = { email: traveler.data.email, verificationCode: travelerEmail.data.verification.code }
      await firestore.create([traveler, travelerEmail])
      const { status } = await request.post('/travelers/verify').send(fields)
      expect(status).to.equal(403)
    })
  })

  describe('When traveler is already verified', () => {
    it('Must return status code 403', async () => {
      const traveler = new Traveler().withHometown()
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
        .withVerification()
        .withRecovery()
      const fields = { email: traveler.data.email, verificationCode: travelerEmail.data.verification.code }
      await firestore.create([traveler, travelerEmail])
      const { status } = await request.post('/travelers/verify').send(fields)
      expect(status).to.equal(403)
    })
  })

  describe('When any of the required fields are missing', () => {
    it('Must return status code 400', async () => {
      const traveler = new Traveler().withHometown()
      const travelerEmail = new TravelerEmail().withVerification().withRecovery()
      const fields = { email: traveler.data.email, verificationCode: travelerEmail.data.verification.code }
      const combinations = GenerateCombinations(fields)
      for (const combination of combinations) {
        const { status } = await request.post('/travelers/verify').send(combination)
        expect(status).to.equal(400)
      }
    })
  })
})

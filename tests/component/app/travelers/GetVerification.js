const Mocha = require('mocha')
const Chai = require('chai')
const ChaiHttp = require('chai-http')
const Firestore = require('../../../datastore/Firestore')
const Config = require('../../../configs/Application')
const Keys = require('../../../helpers/Keys')
const ObjectsMustEqual = require('../../../helpers/ObjectsMustEqual')
const Traveler = require('../../../mockModels/Traveler')
const TravelerEmail = require('../../../mockModels/TravelerEmail')

const { describe, beforeEach, after, it } = Mocha
const { expect } = Chai
const firestore = new Firestore()
const apiVersion = '/v1'

Chai.use(ChaiHttp)

describe(`Calling GET /travelers/verification`, () => {
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
      const fields = { email: traveler.data.email }
      await firestore.create([traveler, travelerEmail])
      const { status, body: { data } } = await request
        .get(`/travelers/verification?email=${traveler.data.email}`)
        .send(fields)
      expect(status).to.equal(200)
      ObjectsMustEqual({
        keys: Keys({ object: data }),
        source: data,
        target: travelerEmail.data.verification
      })
    })
  })

  describe('When email does not exist', () => {
    it('Must return status code 404', async () => {
      const traveler = new Traveler()
      const fields = { email: traveler.data.email }
      await firestore.create([traveler])
      const { status } = await request
        .get(`/travelers/verification?email=${traveler.data.email}`)
        .send(fields)
      expect(status).to.equal(404)
    })
  })
})

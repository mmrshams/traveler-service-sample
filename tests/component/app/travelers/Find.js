const Mocha = require('mocha')
const Chai = require('chai')
const ChaiHttp = require('chai-http')
const Firestore = require('../../../datastore/Firestore')
const Config = require('../../../configs/Application')
const ObjectsMustEqual = require('../../../helpers/ObjectsMustEqual')
const Keys = require('../../../helpers/Keys')
const Traveler = require('../../../mockModels/Traveler')
const TravelerEmail = require('../../../mockModels/TravelerEmail')

const { describe, beforeEach, after, it } = Mocha
const { expect } = Chai
const firestore = new Firestore()
const apiVersion = '/v1'

Chai.use(ChaiHttp)

describe(`Calling GET /travelers/find`, () => {
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
      await firestore.create([traveler, travelerEmail])
      const { status, body: { data } } = await request.get(`/travelers/find?email=${traveler.data.email}`)
      expect(status).to.equal(200)
      ObjectsMustEqual({
        keys: Keys({ object: data }),
        source: data,
        target: traveler.data
      })
    })
  })

  describe('When email does not exist', () => {
    it('Must return status code 404', async () => {
      const traveler = new Traveler()
      await firestore.create([traveler])
      const { status } = await request.get(`/travelers/find?email=${traveler.data.email}`)
      expect(status).to.equal(404)
    })
  })

  describe('When traveler is does not exist', () => {
    it('Must return status code 404', async () => {
      const traveler = new Traveler()
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
      await firestore.create([travelerEmail])
      const { status } = await request.get(`/travelers/find?email=${traveler.data.email}`)
      expect(status).to.equal(404)
    })
  })
})

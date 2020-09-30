const Mocha = require('mocha')
const Chai = require('chai')
const ChaiHttp = require('chai-http')
const Firestore = require('../../../datastore/Firestore')
const Config = require('../../../configs/Application')
const Traveler = require('../../../mockModels/Traveler')
const AcceptedTerm = require('../../../mockModels/AcceptedTerm')

const { describe, beforeEach, after, it } = Mocha
const { expect } = Chai
const firestore = new Firestore()
const apiVersion = '/v1'

Chai.use(ChaiHttp)

describe(`Calling POST /travelers/:id/acceptTerms`, () => {
  let request
  beforeEach(async () => {
    request = Chai.request(Config.server.base + apiVersion)
  })

  after(async () => {
    await firestore.cleanup()
  })

  describe('When required params are provided', () => {
    it('Must return status code 204', async () => {
      const traveler = new Traveler().withHometown()
      const acceptedTerm = new AcceptedTerm({ travelerId: traveler.id })
      await firestore.create([ traveler, acceptedTerm ])
      const { status } = await request.post(`/travelers/${traveler.id}/acceptTerms`).send({})
      expect(status).to.equal(204)
    })
  })

  describe('When traveler id does not exist', () => {
    it('Must return status code 204', async () => {
      const traveler = new Traveler({ state: 'active' }).withHometown()
      const { status } = await request.post(`/travelers/${traveler.id}/acceptTerms`).send({})
      expect(status).to.equal(204)
    })
  })
})

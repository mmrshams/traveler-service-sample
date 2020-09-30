const Mocha = require('mocha')
const Chai = require('chai')
const ChaiHttp = require('chai-http')
const Firestore = require('../../../datastore/Firestore')
const Config = require('../../../configs/Application')
const Filter = require('../../../helpers/Filter')
const ObjectsMustEqual = require('../../../helpers/ObjectsMustEqual')
const ModelsMustPersist = require('../../../helpers/ModelsMustPersist')
const GenerateCombinations = require('../../../helpers/GenerateCombinations')
const Traveler = require('../../../mockModels/Traveler')
const TravelerEmail = require('../../../mockModels/TravelerEmail')

const { describe, beforeEach, after, it } = Mocha
const { expect } = Chai
const firestore = new Firestore()
const apiVersion = '/v1'

Chai.use(ChaiHttp)

describe(`Calling POST /travelers`, () => {
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
      const keys = ['firstName', 'lastName', 'email', 'hometown', 'channel']
      const fields = Filter({ keys, object: traveler.data })
      const { status, body: { data } } = await request.post('/travelers').send(fields)
      expect(status).to.equal(200)
      expect(data.state).to.equal('active')
      expect(data.health).to.equal('clean')
      expect(data.interests).to.exist.and.be.an('array').that.has.lengthOf(0)
      expect(data.auth).to.exist.which.is.an('string')
      ObjectsMustEqual({ keys, source: data, target: traveler.data })
      const travelerEmail = await Firestore.getByModel(
        new TravelerEmail({ email: traveler.data.email })
      )
      ModelsMustPersist([travelerEmail])
    })
  })

  describe('When any of the required fields are missing', () => {
    it('Must return status code 400', async () => {
      const traveler = new Traveler().withHometown()
      const keys = ['firstName', 'lastName', 'email', 'hometown', 'channel']
      const fields = Filter({ keys, object: traveler.data })
      const combinations = GenerateCombinations(fields)
      for (const combination of combinations) {
        const { status } = await request.post('/travelers').send(combination)
        expect(status).to.equal(400)
      }
    })
  })
})

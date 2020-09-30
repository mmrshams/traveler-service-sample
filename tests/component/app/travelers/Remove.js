const Mocha = require('mocha')
const Chai = require('chai')
const ChaiHttp = require('chai-http')
const Firestore = require('../../../datastore/Firestore')
const Config = require('../../../configs/Application')
const Retry = require('../../../helpers/Retry')
const ModelsMustNotPersist = require('../../../helpers/ModelsMustNotPersist')
const ModelsMustPersist = require('../../../helpers/ModelsMustPersist')
const Traveler = require('../../../mockModels/Traveler')
const TravelerCopy = require('../../../mockModels/TravelerCopy')
const Access = require('../../../mockModels/Access')
const { describe, beforeEach, after, it } = Mocha
const { expect } = Chai
const firestore = new Firestore()
const apiVersion = '/v1'

Chai.use(ChaiHttp)

describe(`Calling DELETE /travelers/:id`, () => {
  let request
  beforeEach(async () => {
    request = Chai.request(Config.server.base + apiVersion)
  })

  after(async () => {
    await firestore.cleanup()
  })

  describe('When required params are provided', () => {
    it('Must return status code 204', async () => {
      const traveler = new Traveler({ state: 'active' })
      const travelerCopy = new TravelerCopy({ travelerId: traveler.id })
      const access = new Access({ travelerId: traveler.id })
      await firestore.create([ traveler, travelerCopy, access ])
      const { status } = await request.delete(`/travelers/${traveler.id}`)
      await Retry(async () => {
        const deletedModels = await Firestore.getAllByModel([travelerCopy, access])
        if (deletedModels.some(i => i !== undefined)) return false
        ModelsMustNotPersist(deletedModels)
        const alteredTraveler = await Firestore.getByModel(traveler)
        expect(alteredTraveler.state).to.equal('deleted')
        expect(status).to.equal(204)
      })
    })
  })

  describe('When traveler state is already set to deleted', () => {
    it('Must return status code 204', async () => {
      const traveler = new Traveler({ state: 'deleted' })
      const travelerCopy = new TravelerCopy({ travelerId: traveler.id })
      const access = new Access({ travelerId: traveler.id })
      await firestore.create([ traveler, travelerCopy, access ])
      const { status } = await request.delete(`/travelers/${traveler.id}`)
      const models = await Firestore.getAllByModel([travelerCopy, access])
      ModelsMustPersist(models)
      expect(status).to.equal(204)
    })
  })

  describe('When traveler id does not exist', () => {
    it('Must return status code 404', async () => {
      const traveler = new Traveler({ state: 'active' })
      const { status } = await request.delete(`/travelers/${traveler.id}`)
      expect(status).to.equal(404)
    })
  })
})

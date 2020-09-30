const Mocha = require('mocha')
const Chai = require('chai')
const ChaiHttp = require('chai-http')
const Firestore = require('../../../datastore/Firestore')
const Config = require('../../../configs/Application')
const Keys = require('../../../helpers/Keys')
const ObjectsMustEqual = require('../../../helpers/ObjectsMustEqual')
const Traveler = require('../../../mockModels/Traveler')
const Access = require('../../../mockModels/Access')

const { describe, beforeEach, after, it } = Mocha
const { expect } = Chai
const firestore = new Firestore()
const apiVersion = '/v1'

Chai.use(ChaiHttp)

describe(`Calling POST /accesses/:id/deny`, () => {
  let request
  beforeEach(async () => {
    request = Chai.request(Config.server.base + apiVersion)
  })

  after(async () => {
    await firestore.cleanup()
  })

  describe('When required params are provided', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler({ state: 'active', health: 'reported' })
      const access = new Access({ travelerId: traveler.id })
      await firestore.create([ traveler, access ])
      const { status, body: { data } } = await request
        .post(`/accesses/${access.id}/deny`)
        .send({ travelerId: traveler.id })
      expect(status).to.equal(200)
      expect(data.status).to.exist.which.equals('denied')
      ObjectsMustEqual({
        keys: Keys({ object: data, keys: ['status', 'updatedAt'], exclude: true }),
        source: data,
        target: access.data
      })
    })
  })

  describe('When access id does not exist', () => {
    it('Must return status code 404', async () => {
      const traveler = new Traveler({ state: 'active', health: 'reported' })
      const access = new Access({ travelerId: traveler.id })
      const { status } = await request.post(`/accesses/${access.id}/deny`).send({ travelerId: traveler.id })
      expect(status).to.equal(404)
    })
  })

  describe('When access id does not match', () => {
    it('Must return status code 404', async () => {
      const traveler = new Traveler({ state: 'active', health: 'reported' })
      const access = new Access()
      await firestore.create([ access ])
      const { status } = await request.post(`/accesses/${access.id}/deny`).send({ travelerId: traveler.id })
      expect(status).to.equal(404)
    })
  })

  describe('When traveler id is missing', () => {
    it('Must return status code 400', async () => {
      const { status } = await request.post(`/accesses/0/deny`).send({})
      expect(status).to.equal(400)
    })
  })
})

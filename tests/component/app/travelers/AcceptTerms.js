const Mocha = require('mocha')
const Chai = require('chai')
const ChaiHttp = require('chai-http')
const Firestore = require('../../../datastore/Firestore')
const Config = require('../../../configs/Application')
const Keys = require('../../../helpers/Keys')
const ObjectsMustEqual = require('../../../helpers/ObjectsMustEqual')
const Traveler = require('../../../mockModels/Traveler')

const { describe, beforeEach, after, it } = Mocha
const { expect } = Chai
const firestore = new Firestore()
const apiVersion = '/v1'

Chai.use(ChaiHttp)

describe(`Calling PATCH /travelers/:id/health`, () => {
  let request
  beforeEach(async () => {
    request = Chai.request(Config.server.base + apiVersion)
  })

  after(async () => {
    await firestore.cleanup()
  })

  describe('When required params are provided', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler({ state: 'active', health: 'reported' }).withHometown()
      await firestore.create([ traveler ])
      const { status, body: { data } } = await request
        .patch(`/travelers/${traveler.id}/health`)
        .send({ health: 'clean' })
      expect(status).to.equal(200)
      expect(data.health).to.exist.which.equals('clean')
      ObjectsMustEqual({
        keys: Keys({ object: data, keys: ['health'], exclude: true }),
        source: data,
        target: traveler.data
      })
    })
  })

  describe('When traveler id does not exist', () => {
    it('Must return status code 404', async () => {
      const traveler = new Traveler({ state: 'active' }).withHometown()
      const { status } = await request
        .patch(`/travelers/${traveler.id}/health`)
        .send({ health: 'clean' })
      expect(status).to.equal(404)
    })
  })

  describe('When health field is missing', () => {
    it('Must return status code 400', async () => {
      const traveler = new Traveler({ state: 'deleted' }).withHometown()
      await firestore.create([ traveler ])
      const { status } = await request.patch(`/travelers/${traveler.id}/health`).send()
      expect(status).to.equal(400)
    })
  })
})

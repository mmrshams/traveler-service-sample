const Mocha = require('mocha')
const Chai = require('chai')
const ChaiHttp = require('chai-http')
const Firestore = require('../../../datastore/Firestore')
const Config = require('../../../configs/Application')
const ObjectsMustEqual = require('../../../helpers/ObjectsMustEqual')
const Keys = require('../../../helpers/Keys')
const Traveler = require('../../../mockModels/Traveler')
const Access = require('../../../mockModels/Access')

const { describe, beforeEach, after, it } = Mocha
const { expect } = Chai
const firestore = new Firestore()
const apiVersion = '/v1'

Chai.use(ChaiHttp)

describe(`Calling GET /accesses`, () => {
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
      const query = `?filter[travelerId]=${traveler.id}`
      const { status, body: { data } } = await request.get(`/accesses${query}`)
      expect(status).to.equal(200)
      ObjectsMustEqual({
        keys: Keys({ object: data }),
        source: data,
        target: access.data,
        pivot: 'id'
      })
    })
  })

  describe('When wrong status is set', () => {
    it('Must return status code 400', async () => {
      const traveler = new Traveler({ state: 'active', health: 'reported' })
      const access = new Access({ travelerId: traveler.id })
      await firestore.create([ traveler, access ])
      const query = `?filter[status]=WRONG`
      const { status } = await request.get(`/accesses${query}`)
      expect(status).to.equal(400)
    })
  })

  describe('When wrong type is set', () => {
    it('Must return status code 400', async () => {
      const traveler = new Traveler({ state: 'active', health: 'reported' })
      const access = new Access({ travelerId: traveler.id })
      await firestore.create([ traveler, access ])
      const query = `?filter[type]=WRONG`
      const { status } = await request.get(`/accesses${query}`)
      expect(status).to.equal(400)
    })
  })
})

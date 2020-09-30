const Mocha = require('mocha')
const Chai = require('chai')
const ChaiHttp = require('chai-http')
const Firestore = require('../../../datastore/Firestore')
const Config = require('../../../configs/Application')
const Keys = require('../../../helpers/Keys')
const Retry = require('../../../helpers/Retry')
const ObjectsMustEqual = require('../../../helpers/ObjectsMustEqual')
const Traveler = require('../../../mockModels/Traveler')
const TravelerEmail = require('../../../mockModels/TravelerEmail')
const TravelerCopy = require('../../../mockModels/TravelerCopy')

const { describe, beforeEach, after, it } = Mocha
const { expect } = Chai
const firestore = new Firestore()
const apiVersion = '/v1'

Chai.use(ChaiHttp)

describe(`Calling GET /travelerCopies`, () => {
  let request
  beforeEach(async () => {
    request = Chai.request(Config.server.base + apiVersion)
  })

  after(async () => {
    await firestore.cleanup()
  })

  describe('When bare minimum query is provided', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler({ state: 'active', health: 'clean' })
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
      const travelerCopy = new TravelerCopy({ travelerId: traveler.id, email: traveler.data.email })
      await firestore.create([traveler, travelerEmail, travelerCopy])
      const query = `?q=${travelerCopy.data.firstName}`
      await Retry(async () => {
        const { status, body: { data: { list } } } = await request.get(`/travelerCopies${query}`)
        if (list.length < 1 || !list.find(item => item.email === travelerCopy.data.email)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: list[0], keys: ['id'], exclude: true }),
          source: list,
          target: Object.assign({}, traveler.data, travelerCopy.data),
          pivot: 'email'
        })
      })
    })
  })

  describe('When ownerId filter is set', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler({ state: 'active', health: 'clean' })
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
      const travelerCopy = new TravelerCopy({ travelerId: traveler.id, email: traveler.data.email })
      await firestore.create([traveler, travelerEmail, travelerCopy])
      const q = `?q=${travelerCopy.data.firstName}`
      const filter = `&filter[ownerId]=${travelerCopy.data.ownerId}`
      const query = `${q}${filter}`
      await Retry(async () => {
        const { status, body: { data: { list } } } = await request.get(`/travelerCopies${query}`)
        if (list.length < 1 || !list.find(item => item.email === travelerCopy.data.email)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: list[0], keys: ['id'], exclude: true }),
          source: list,
          target: Object.assign({}, traveler.data, travelerCopy.data),
          pivot: 'email'
        })
      })
    })
  })

  describe('When there is no traveler to match the available copies', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler({ state: 'active', health: 'clean' })
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
      const travelerCopy = new TravelerCopy({ travelerId: traveler.id, email: traveler.data.email })
      await firestore.create([travelerEmail, travelerCopy])
      const query = `?q=${travelerCopy.data.firstName}`
      await Retry(async () => {
        const { status, body: { data: { list } } } = await request.get(`/travelerCopies${query}`)
        if (list.length < 1 || !list.find(item => item.email === travelerCopy.data.email)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: list[0], keys: ['id'], exclude: true }),
          source: list,
          target: Object.assign({}, traveler.data, travelerCopy.data),
          pivot: 'email'
        })
      })
    })
  })

  describe('When queried traveler(s) are not active or are blocked', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler({ state: 'deleted', health: 'blocked' })
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
      const travelerCopy = new TravelerCopy({ travelerId: traveler.id, email: traveler.data.email })
      await firestore.create([traveler, travelerEmail, travelerCopy])
      const q = `?q=${travelerCopy.data.firstName}`
      const filter = `&filter[ownerId]=${travelerCopy.data.ownerId}`
      const query = `${q}${filter}`
      await Retry(async () => {
        const { status, body: { data: { list } } } = await request.get(`/travelerCopies${query}`)
        if (list.length < 1 || !list.find(item => item.email === travelerCopy.data.email)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: list[0], keys: ['id'], exclude: true }),
          source: list,
          target: Object.assign({}, traveler.data, travelerCopy.data),
          pivot: 'email'
        })
      })
    })
  })

  describe('When wrong filter is used', () => {
    it('Must return status code 400', async () => {
      const query = `?q=whatever&filter[WRONG]=what`
      const { status } = await request.get(`/travelerCopies${query}`)
      expect(status).to.equal(400)
    })
  })

  describe('When page limit is wrong', () => {
    it('Must return status code 400', async () => {
      const query = `?q=whatever&page[limit]=-100`
      const { status } = await request.get(`/travelerCopies${query}`)
      expect(status).to.equal(400)
    })
  })

  describe('When page offset is wrong', () => {
    it('Must return status code 400', async () => {
      const query = `?q=whatever&page[offset]=-100`
      const { status } = await request.get(`/travelerCopies${query}`)
      expect(status).to.equal(400)
    })
  })
})

const Mocha = require('mocha')
const Chai = require('chai')
const ChaiHttp = require('chai-http')
const Firestore = require('../../../datastore/Firestore')
const Config = require('../../../configs/Application')
const Keys = require('../../../helpers/Keys')
const Retry = require('../../../helpers/Retry')
const ObjectsMustEqual = require('../../../helpers/ObjectsMustEqual')
const Traveler = require('../../../mockModels/Traveler')
const TravelerReports = require('../../../mockModels/TravelerReports')
const TravelerCopy = require('../../../mockModels/TravelerCopy')
const TravelerEmail = require('../../../mockModels/TravelerEmail')

const { describe, beforeEach, after, it } = Mocha
const { expect } = Chai
const firestore = new Firestore()
const apiVersion = '/v1'

Chai.use(ChaiHttp)

describe(`Calling POST /travelers/batch`, () => {
  let request
  beforeEach(async () => {
    request = Chai.request(Config.server.base + apiVersion)
  })

  after(async () => {
    await firestore.cleanup()
  })

  describe('When required params are provided', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler({ state: 'active', health: 'clean' })
      const fields = {
        ids: [traveler.id].join(),
        asObject: false,
        activeTravelers: false,
        withMissedItems: false
      }
      await firestore.create([traveler])
      await Retry(async () => {
        const { status, body: { data } } = await request.post('/travelers/batch').send(fields)
        if (data.length < 1 || !data.find(item => item.id === traveler.id)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: data[0] }),
          source: data,
          target: traveler.data,
          pivot: 'id' })
      })
    })
  })

  describe('When activeTravelers flag is set to true', () => {
    it('Must return status code 200', async () => {
      const traveler1 = new Traveler({ state: 'active', health: 'clean' })
      const traveler2 = new Traveler({ state: 'deleted', health: 'clean' })
      const traveler3 = new Traveler({ state: 'active', health: 'blocked' })
      const fields = {
        ids: [traveler1.id, traveler2.id, traveler3.id].join(),
        asObject: false,
        activeTravelers: true,
        withMissedItems: false
      }
      await firestore.create([traveler1, traveler2, traveler3])
      await Retry(async () => {
        const { status, body: { data } } = await request.post('/travelers/batch').send(fields)
        if (data.length !== 1 || !data.find(item => item.id === traveler1.id)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: data[0] }),
          source: data,
          target: traveler1.data,
          pivot: 'id' })
      })
    })
  })

  describe('When asObject flag is set to true', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler({ state: 'active', health: 'clean' })
      const fields = {
        ids: [traveler.id].join(),
        asObject: true,
        activeTravelers: false,
        withMissedItems: false
      }
      await firestore.create([traveler])
      await Retry(async () => {
        const { status, body: { data } } = await request.post('/travelers/batch').send(fields)
        const list = Object.keys(data).map(id => data[id])
        if (!list.find(item => item.id === traveler.id)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: list[0] }),
          source: list,
          target: traveler.data,
          pivot: 'id' })
      })
    })
  })

  describe('When withMissedItems is true', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler({ state: 'active', health: 'clean' })
      const fields = {
        ids: [traveler.id, 'WRONG'].join(),
        asObject: false,
        activeTravelers: false,
        withMissedItems: true
      }
      await firestore.create([traveler])
      await Retry(async () => {
        const { status, body: { data } } = await request.post('/travelers/batch').send(fields)
        const list = data.filter(item => item !== null && item !== undefined)
        if (!list.find(item => item.id === traveler.id)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: list[0] }),
          source: list,
          target: traveler.data,
          pivot: 'id' })
      })
    })
  })

  describe('When a reported viewer searches for another traveler', () => {
    it('Must return status code 200', async () => {
      const reportedTraveler = new Traveler({ state: 'active', health: 'reported', invisible: false })
      const normalTraveler = new Traveler({ state: 'active', health: 'clean', invisible: false })
      const travelerReports = new TravelerReports({ travelerId: reportedTraveler.id })
        .addReport()
      const fields = {
        ids: `${normalTraveler.id}`,
        viewerId: reportedTraveler.id
      }
      await firestore.create([reportedTraveler, normalTraveler, travelerReports])
      await Retry(async () => {
        const { status, body: { data } } = await request.post('/travelers/batch').send(fields)
        if (data.length < 1 ||
            !data.find(item => item.id === normalTraveler.id) ||
            data.find(item => item.id === reportedTraveler.id)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: data[0] }),
          source: data,
          target: normalTraveler.data,
          pivot: 'id' })
      })
    })
  })

  describe('When viewerId has value and the viewer is invisible', () => {
    it('Must return status code 200', async () => {
      const traveler1 = new Traveler({ state: 'active', health: 'clean', invisible: false })
      const traveler2 = new Traveler({ state: 'active', health: 'clean', invisible: true })
      const travelerReports = new TravelerReports({ travelerId: traveler1.id })
      const fields = {
        ids: [traveler1.id, traveler2.id].join(),
        asObject: false,
        withMissedItems: false,
        viewerId: traveler2.id
      }
      await firestore.create([traveler1, traveler2, travelerReports])
      await Retry(async () => {
        const { status, body: { data } } = await request.post('/travelers/batch').send(fields)
        if (data.length < 1 || !data.find(item => item.id === traveler2.id)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: data[0] }),
          source: data,
          target: traveler2.data,
          pivot: 'id' })
      })
    })
  })

  describe('When viewerId has value and the viewer is visible however there are some invisible travelers', () => {
    it('Must return status code 200', async () => {
      const traveler1 = new Traveler({ state: 'active', health: 'clean', invisible: true })
      const traveler2 = new Traveler({ state: 'active', health: 'clean', invisible: false })
      const travelerReports = new TravelerReports({ travelerId: traveler1.id })
      const fields = {
        ids: [traveler1.id, traveler2.id].join(),
        asObject: false,
        withMissedItems: false,
        viewerId: traveler2.id
      }
      await firestore.create([traveler1, traveler2, travelerReports])
      await Retry(async () => {
        const { status, body: { data } } = await request.post('/travelers/batch').send(fields)
        if (data.length < 1 || !data.find(item => item.id === traveler2.id)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: data[0] }),
          source: data,
          target: traveler2.data,
          pivot: 'id' })
      })
    })
  })

  describe('When viewerId has value and the viewer is visible', () => {
    it('Must return status code 200', async () => {
      const traveler1 = new Traveler({ state: 'active', health: 'clean', invisible: false })
      const traveler2 = new Traveler({ state: 'active', health: 'clean', invisible: false })
      const travelerReports = new TravelerReports({ travelerId: traveler1.id })
      const fields = {
        ids: [traveler1.id, traveler2.id].join(),
        asObject: false,
        withMissedItems: false,
        viewerId: traveler2.id
      }
      await firestore.create([traveler1, traveler2, travelerReports])
      await Retry(async () => {
        const { status, body: { data } } = await request.post('/travelers/batch').send(fields)
        if (data.length !== 2 ||
            !data.find(item => item.id === traveler1.id) ||
            !data.find(item => item.id === traveler2.id)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: data[0] }),
          source: data,
          target: [traveler1.data, traveler2.data],
          pivot: 'id' })
      })
    })
  })

  describe('When hostelId is set', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler({ state: 'active', health: 'clean' })
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
      const travelerCopy = new TravelerCopy({ travelerId: traveler.id, email: traveler.data.email })
      await firestore.create([traveler, travelerEmail, travelerCopy])
      const fields = {
        ids: [traveler.id].join(),
        asObject: false,
        activeTravelers: false,
        withMissedItems: false,
        hostelId: travelerCopy.data.ownerId
      }
      await Retry(async () => {
        const { status, body: { data } } = await request.post('/travelers/batch').send(fields)
        if (!data.find(item => item.id === traveler.id)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: data[0], keys: ['id'], exclude: true }),
          source: data,
          target: Object.assign({}, traveler.data, travelerCopy.data),
          pivot: 'email'
        })
      })
    })
  })

  describe('When ids are set as empty', () => {
    it('Must return status code 400', async () => {
      const fields = { ids: '' }
      const { status } = await request.post('/travelers/batch').send(fields)
      expect(status).to.equal(400)
    })
  })

  describe('When viewer id and hostel id fields are set in request body at the same time', () => {
    it('Must return status code 400', async () => {
      const fields = { ids: '1', viewerId: '2', hostelId: '3' }
      const { status } = await request.post('/travelers/batch').send(fields)
      expect(status).to.equal(400)
    })
  })

  describe('When viewer id and active travelers fields are set in request body at the same time', () => {
    it('Must return status code 400', async () => {
      const fields = { ids: '1', viewerId: '2', activeTravelers: true }
      const { status } = await request.post('/travelers/batch').send(fields)
      expect(status).to.equal(400)
    })
  })

  describe('When ids contain duplication', () => {
    it('Must return status code 400', async () => {
      const fields = { ids: '1,1' }
      const { status } = await request.post('/travelers/batch').send(fields)
      expect(status).to.equal(400)
    })
  })
})

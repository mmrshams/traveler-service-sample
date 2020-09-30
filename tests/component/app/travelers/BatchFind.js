const Mocha = require('mocha')
const Chai = require('chai')
const ChaiHttp = require('chai-http')
const Firestore = require('../../../datastore/Firestore')
const Config = require('../../../configs/Application')
const ObjectsMustEqual = require('../../../helpers/ObjectsMustEqual')
const Keys = require('../../../helpers/Keys')
const Retry = require('../../../helpers/Retry')
const Traveler = require('../../../mockModels/Traveler')
const TravelerEmail = require('../../../mockModels/TravelerEmail')

const { describe, beforeEach, after, it } = Mocha
const { expect } = Chai
const firestore = new Firestore()
const apiVersion = '/v1'

Chai.use(ChaiHttp)

describe(`Calling POST /travelers/batchFind`, () => {
  let request
  beforeEach(async () => {
    request = Chai.request(Config.server.base + apiVersion)
  })

  after(async () => {
    await firestore.cleanup()
  })

  describe('When required params are provided', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler({ health: 'clean', state: 'active' })
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
      const fields = {
        emails: [traveler.data.email].join(),
        asObject: false,
        withMissedItems: false,
        activeTravelers: false
      }
      await firestore.create([traveler, travelerEmail])
      await Retry(async () => {
        const { status, body: { data } } = await request
          .post(`/travelers/batchFind`)
          .send(fields)
        if (data.length < 1 || !data.find(item => item.id === traveler.id)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: data[0] }),
          target: data,
          source: [traveler.data],
          pivot: 'id'
        })
      })
    })
  })

  describe('When asObject is set to true', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler({ health: 'clean', state: 'active' })
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
      const fields = {
        emails: [traveler.data.email].join(),
        asObject: true,
        withMissedItems: false,
        activeTravelers: false
      }
      await firestore.create([traveler, travelerEmail])
      await Retry(async () => {
        const { status, body: { data } } = await request
          .post(`/travelers/batchFind`)
          .send(fields)
        const list = Keys({ object: data }).map(id => data[id])
        if (list.length < 1 || !list.find(item => item.id === traveler.id)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: list }),
          source: list,
          target: [traveler.data],
          pivot: 'id'
        })
      })
    })
  })

  describe('When withMissedItems is set to true', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler({ health: 'clean', state: 'active' })
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
      const fields = {
        emails: [traveler.data.email, 'wrong@email.com'].join(),
        asObject: false,
        withMissedItems: true,
        activeTravelers: false
      }
      await firestore.create([traveler, travelerEmail])
      await Retry(async () => {
        const { status, body: { data } } = await request
          .post(`/travelers/batchFind`)
          .send(fields)
        const list = data.filter(item => item !== null)
        if (!list.find(item => item.id === traveler.id)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: list[0] }),
          source: list,
          target: traveler.data,
          pivot: 'id'
        })
      })
    })
  })

  describe('When activeTravelers is set to true', () => {
    it('Must return status code 200', async () => {
      const traveler1 = new Traveler({ state: 'active', health: 'reported' })
      const traveler2 = new Traveler({ state: 'deleted', health: 'reported' }) // gets dropped
      const traveler3 = new Traveler({ state: 'active', health: 'blocked' }) // gets dropped
      const fields = {
        emails: [traveler1.data.email, traveler2.data.email, traveler3.data.email].join(),
        asObject: false,
        withMissedItems: false,
        activeTravelers: true
      }
      await firestore.create([traveler1, traveler2, traveler3])
      await Retry(async () => {
        const { status, body: { data } } = await request
          .post(`/travelers/batchFind`)
          .send(fields)
        if (data.length < 1 || !data.find(item => item.id === traveler1.id)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: data }),
          source: data,
          target: [traveler1.data],
          pivot: 'id'
        })
      })
    })
  })

  describe('When email is missing', () => {
    it('Must return status code 400', async () => {
      const traveler = new Traveler()
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
      await firestore.create([travelerEmail])
      const { status } = await request.post(`/travelers/batchFind`).send({})
      expect(status).to.equal(400)
    })
  })

  describe('When emails has duplication', () => {
    it('Must return status code 400', async () => {
      const { status } = await request.post(`/travelers/batchFind`).send({
        emails: 'duplicated@email.com,duplicated@email.com'
      })
      expect(status).to.equal(400)
    })
  })
})

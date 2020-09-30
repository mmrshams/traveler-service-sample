const Mocha = require('mocha')
const Chai = require('chai')
const ChaiHttp = require('chai-http')
const Firestore = require('../../../datastore/Firestore')
const Config = require('../../../configs/Application')
const Keys = require('../../../helpers/Keys')
const Retry = require('../../../helpers/Retry')
const ObjectsMustEqual = require('../../../helpers/ObjectsMustEqual')
const Traveler = require('../../../mockModels/Traveler')
const TravelerCopy = require('../../../mockModels/TravelerCopy')
const TravelerEmail = require('../../../mockModels/TravelerEmail')
const AcceptedTerm = require('../../../mockModels/AcceptedTerm')
const TravelerReports = require('../../../mockModels/TravelerReports')

const { describe, beforeEach, after, it } = Mocha
const { expect } = Chai
const firestore = new Firestore()
const apiVersion = '/v1'

Chai.use(ChaiHttp)

describe(`Calling POST /travelers/:id`, () => {
  let request
  beforeEach(async () => {
    request = Chai.request(Config.server.base + apiVersion)
  })

  after(async () => {
    await firestore.cleanup()
  })

  describe('When a bare minimum query is submitted', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler({ state: 'active', health: 'reported', invisible: false })
      await firestore.create([traveler])
      await Retry(async () => {
        const { status, body: { data } } = await request.get(`/travelers/${traveler.id}`)
        if (!data) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: data }),
          source: data,
          target: traveler.data
        })
      })
    })
  })

  describe('When viewer id is set', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler({ state: 'active', health: 'reported', invisible: false })
      const viewerTraveler = new Traveler({ state: 'active', health: 'reported', invisible: false })
      await firestore.create([traveler, viewerTraveler])
      await Retry(async () => {
        const { status, body: { data } } = await request
          .get(`/travelers/${traveler.id}?viewerId=${viewerTraveler.id}`)
        if (!data) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: data }),
          source: data,
          target: traveler.data
        })
      })
    })
  })

  describe('When viewer is provided however it is invisible', () => {
    it('Must return status code 404', async () => {
      const traveler = new Traveler({ state: 'active', health: 'reported', invisible: false })
      const viewer = new Traveler({ state: 'active', health: 'reported', invisible: true })
      await firestore.create([traveler, viewer])
      await Retry(async () => {
        const { status } = await request.get(`/travelers/${traveler.id}?viewerId=${viewer.id}`)
        if (status !== 404) return false
        expect(status).to.equal(404)
      })
    })
  })

  describe('When viewer is trying to look for an invisible traveler', () => {
    it('Must return status code 404', async () => {
      const traveler = new Traveler({ state: 'active', health: 'reported', invisible: true })
      const viewer = new Traveler({ state: 'active', health: 'reported', invisible: false })
      await firestore.create([traveler, viewer])
      const { status } = await request.get(`/travelers/${traveler.id}?viewerId=${viewer.id}`)
      expect(status).to.equal(404)
    })
  })

  describe('When a reported viewer searches for another traveler', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler({ state: 'active', health: 'reported', invisible: false })
      const reportedTraveler = new Traveler({ state: 'active', health: 'reported', invisible: false })
      const travelerReports = new TravelerReports({ travelerId: reportedTraveler.id }).addReport()
      await firestore.create([traveler, reportedTraveler, travelerReports])
      await Retry(async () => {
        const { status, body: { data } } =
          await request.get(`/travelers/${traveler.id}?viewerId=${reportedTraveler.id}`)
        if (!data) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: data }),
          source: data,
          target: traveler.data
        })
      })
    })
  })

  describe('When a reported and invisible viewer searches for herself', () => {
    it('Must return status code 200', async () => {
      const invisibleAndReportedTraveler = new Traveler({ state: 'active', health: 'reported', invisible: true })
      const travelerReports = new TravelerReports({ travelerId: invisibleAndReportedTraveler.id }).addReport()
      await firestore.create([invisibleAndReportedTraveler, travelerReports])
      await Retry(async () => {
        const { status, body: { data } } =
          await request.get(`/travelers/${invisibleAndReportedTraveler.id}?viewerId=${invisibleAndReportedTraveler.id}`)
        if (!data) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: data }),
          source: data,
          target: invisibleAndReportedTraveler.data
        })
      })
    })
  })

  describe('When extended by "acceptedTerms"', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler({ state: 'active', health: 'reported' })
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
      const acceptedTerm = new AcceptedTerm({ travelerId: traveler.id })
      await firestore.create([traveler, travelerEmail, acceptedTerm])
      await Retry(async () => {
        const { status, body: { data } } = await request
          .get(`/travelers/${traveler.id}?extend=acceptedTerms`)
        if (!data) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: data.acceptedTerms[0] }),
          source: data.acceptedTerms[0],
          target: acceptedTerm.data
        })
        ObjectsMustEqual({
          keys: Keys({ object: data, keys: ['acceptedTerms'], exclude: true }),
          source: data,
          target: traveler.data
        })
      })
    })
  })

  describe('When hostel id is added as a filter', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler({ state: 'active', health: 'reported', invisible: false })
      const travelerCopy = new TravelerCopy({ travelerId: traveler.id })
      await firestore.create([traveler, travelerCopy])
      await Retry(async () => {
        const { status, body: { data } } =
          await request.get(`/travelers/${traveler.id}?filter[hostelId]=${travelerCopy.data.ownerId}`)
        if (!data) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: data, keys: ['id', 'travelerId', 'createdAt', 'updatedAt'], exclude: true }),
          source: data,
          target: Object.assign({}, traveler.data, travelerCopy.data)
        })
      })
    })
  })

  describe('When hostel id does not exist', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler({ state: 'active', health: 'reported', invisible: false })
      const travelerCopy = new TravelerCopy({ travelerId: traveler.id })
      await firestore.create([traveler])
      await Retry(async () => {
        const { status, body: { data } } =
          await request.get(`/travelers/${traveler.id}?filter[hostelId]=${travelerCopy.data.ownerId}`)
        if (!data) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: data }),
          source: data,
          target: traveler.data
        })
      })
    })
  })

  describe('When extended with wrong field', () => {
    it('Must return status code 400', async () => {
      const { status } = await request.get(`/travelers/1?extend=WRONG`)
      expect(status).to.equal(400)
    })
  })

  describe('When traveler does not exist', () => {
    it('Must return status code 404', async () => {
      const traveler = new Traveler({ state: 'active', health: 'reported' })
      const { status } = await request.get(`/travelers/${traveler.id}`)
      expect(status).to.equal(404)
    })
  })

  describe('When viewer does not exist', () => {
    it('Must return status code 404', async () => {
      const traveler = new Traveler({ state: 'active', health: 'reported', invisible: false })
      const viewer = new Traveler({ state: 'active', health: 'reported', invisible: false })
      await firestore.create([traveler])
      await Retry(async () => {
        const { status } = await request.get(`/travelers/${viewer.id}?viewerId=${traveler.id}`)
        if (status !== 404) return false
        expect(status).to.equal(404)
      })
    })
  })
})

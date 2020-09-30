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

const { describe, beforeEach, after, it } = Mocha
const { expect } = Chai
const firestore = new Firestore()
const apiVersion = '/v1'

Chai.use(ChaiHttp)

describe(`Calling GET /reports`, () => {
  let request
  beforeEach(async () => {
    request = Chai.request(Config.server.base + apiVersion)
  })

  after(async () => {
    await firestore.cleanup()
  })

  describe('When required params are provided', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler()
      const travelerReports = new TravelerReports({ travelerId: traveler.id }).addReport()
      await firestore.create([traveler, travelerReports])
      const query =
        `?filter[travelerId]=${traveler.id}` +
        `&filter[reporterId]=${travelerReports.data.reports[0].reporterId}`
      await Retry(async () => {
        const { status, body: { data: { list } } } = await request.get(`/reports${query}`)
        if (!list.find(item => item.travelerId === traveler.id)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: list[0] }),
          source: list,
          target: travelerReports.data,
          pivot: 'email'
        })
      })
    })
  })

  describe('When travelerIdOrReporterId is used', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler()
      const travelerReports = new TravelerReports({ travelerId: traveler.id }).addReport()
      await firestore.create([traveler, travelerReports])
      const query = `?filter[travelerIdOrReporterId]=${traveler.id}`
      await Retry(async () => {
        const { status, body: { data: { list } } } = await request.get(`/reports${query}`)
        if (!list.find(item => item.travelerId === traveler.id)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: list[0] }),
          source: list,
          target: travelerReports.data,
          pivot: 'email'
        })
      })
    })
  })

  describe('When needReview field is set', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler()
      const travelerReports = new TravelerReports({ travelerId: traveler.id, needReview: false }).addReport()
      await firestore.create([traveler, travelerReports])
      const query = `?filter[travelerId]=${traveler.id}&filter[needReview]=true`
      await Retry(async () => {
        const { status, body: { data: { list } } } = await request.get(`/reports${query}`)
        if (list.length > 1) return false
        expect(status).to.equal(200)
        expect(list).to.be.empty
      })
    })
  })

  describe('When extended with "traveler"', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler()
      const travelerReports = new TravelerReports({ travelerId: traveler.id }).addReport()
      await firestore.create([traveler, travelerReports])
      const query = `?filter[travelerIdOrReporterId]=${traveler.id}&extend=traveler`
      await Retry(async () => {
        const { status, body: { data: { list } } } = await request.get(`/reports${query}`)
        if (!list.find(item => item.travelerId === traveler.id)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: list[0], keys: ['traveler', 'reports'], exclude: true }),
          source: list,
          target: travelerReports.data,
          pivot: 'id'
        })
      })
    })
  })

  describe('When wrong filter is used', () => {
    it('Must return status code 400', async () => {
      const query = `?q=whatever&filter[WRONG]=what`
      const { status } = await request.get(`/reports${query}`)
      expect(status).to.equal(400)
    })
  })

  describe('When wrong sort field is used', () => {
    it('Must return status code 400', async () => {
      const query = `?q=whatever&sort=-WRONG`
      const { status } = await request.get(`/reports${query}`)
      expect(status).to.equal(400)
    })
  })

  describe('When page limit is wrong', () => {
    it('Must return status code 400', async () => {
      const query = `?q=whatever&page[limit]=-100`
      const { status } = await request.get(`/reports${query}`)
      expect(status).to.equal(400)
    })
  })

  describe('When page offset is wrong', () => {
    it('Must return status code 400', async () => {
      const query = `?q=whatever&page[offset]=-100`
      const { status } = await request.get(`/reports${query}`)
      expect(status).to.equal(400)
    })
  })
})

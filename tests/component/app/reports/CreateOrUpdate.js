const Mocha = require('mocha')
const Chai = require('chai')
const ChaiHttp = require('chai-http')
const Firestore = require('../../../datastore/Firestore')
const Config = require('../../../configs/Application')
const GenerateCombinations = require('../../../helpers/GenerateCombinations')
const Traveler = require('../../../mockModels/Traveler')
const TravelerEmail = require('../../../mockModels/TravelerEmail')
const TravelerReports = require('../../../mockModels/TravelerReports')

const { describe, beforeEach, after, it } = Mocha
const { expect } = Chai
const firestore = new Firestore()
const apiVersion = '/v1'

Chai.use(ChaiHttp)

describe(`Calling PATCH /reports`, () => {
  let request
  beforeEach(async () => {
    request = Chai.request(Config.server.base + apiVersion)
  })

  after(async () => {
    await firestore.cleanup()
  })

  describe('When required params are provided', () => {
    it('Must return status code 204', async () => {
      const traveler = new Traveler({ state: 'active', health: 'clean' })
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
      const travelerReports = new TravelerReports({ travelerId: traveler.id }).addReport()
      await firestore.create([traveler, travelerEmail, travelerReports])
      const { status } = await request
        .patch(`/reports`)
        .send({ reporterId: travelerReports.id, travelerId: traveler.id, reason: 'nothing' })
      expect(status).to.equal(204)
    })
  })

  describe('When reporterId and travelerId are the same', () => {
    it('Must return status code 406', async () => {
      const traveler = new Traveler()
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
      const travelerReports = new TravelerReports({ travelerId: traveler.id }).addReport()
      await firestore.create([traveler, travelerEmail, travelerReports])
      const { status } = await request
        .patch(`/reports`)
        .send({ reporterId: traveler.id, travelerId: traveler.id })
      expect(status).to.equal(406)
    })
  })

  describe('When traveler does not exist', () => {
    it('Must return status code 404', async () => {
      const traveler = new Traveler()
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
      const travelerReports = new TravelerReports({ travelerId: traveler.id }).addReport()
      await firestore.create([travelerEmail, travelerReports])
      const { status } = await request
        .patch(`/reports`)
        .send({ reporterId: travelerReports.id, travelerId: traveler.id, reason: 'nothing' })
      expect(status).to.equal(404)
    })
  })

  describe('When any of the required fields are missing', () => {
    it('Must return status code 400', async () => {
      const fields = { reporterId: '0', travelerId: '0' }
      const combinations = GenerateCombinations(fields)
      for (const combination of combinations) {
        const { status } = await request.patch(`/reports`).send(combination)
        expect(status).to.equal(400)
      }
    })
  })
})

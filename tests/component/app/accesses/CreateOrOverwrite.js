const Mocha = require('mocha')
const Chai = require('chai')
const ChaiHttp = require('chai-http')
const Firestore = require('../../../datastore/Firestore')
const Config = require('../../../configs/Application')
const GenerateCombinations = require('../../../helpers/GenerateCombinations')
const Traveler = require('../../../mockModels/Traveler')

const { describe, beforeEach, after, it } = Mocha
const { expect } = Chai
const firestore = new Firestore()
const apiVersion = '/v1'

Chai.use(ChaiHttp)

describe(`Calling PATCH /accesses`, () => {
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
      const fields = { travelerId: traveler.id, requesterId: traveler.id, type: 'checkIn', hostelId: '123456' }
      await firestore.create([ traveler ])
      const { status, body: { data } } = await request.patch('/accesses').send(fields)
      expect(status).to.equal(200)
      expect(data.travelerId).to.exist.which.equals(traveler.id)
      expect(data.type).to.exist.which.equals('checkIn')
      expect(data.hostelId).to.exist.which.equals(fields.hostelId)
      expect(data.requesterId).to.exist.which.equals(fields.requesterId)
      expect(data.status).to.exist.which.equals('pending')
      expect(data.id).to.exist.which.is.a('string').and.is.not.empty
    })
  })

  describe('When traveler id does not exist', () => {
    it('Must return status code 404', async () => {
      const traveler = new Traveler({ state: 'active', health: 'reported' })
      const fields = { travelerId: traveler.id, requesterId: traveler.id, type: 'checkIn', hostelId: '123456' }
      const { status } = await request.patch('/accesses').send(fields)
      expect(status).to.equal(404)
    })
  })

  describe('When type is checkin and hostel id is missing', () => {
    it('Must return status code 400', async () => {
      const traveler = new Traveler({ state: 'active', health: 'reported' })
      const fields = { travelerId: traveler.id, requesterId: traveler.id, type: 'checkIn' }
      await firestore.create([ traveler ])
      const { status } = await request.patch('/accesses').send(fields)
      expect(status).to.equal(400)
    })
  })

  describe('When any of the required fields are missing', () => {
    it('Must return status code 400', async () => {
      const traveler = new Traveler({ state: 'active', health: 'reported' })
      const fields = { travelerId: traveler.id, requesterId: traveler.id, type: 'checkIn', hostelId: '123456' }
      const combinations = GenerateCombinations(fields)
      for (const combination of combinations) {
        const { status } = await request.patch('/accesses').send(combination)
        expect(status).to.equal(400)
      }
    })
  })
})

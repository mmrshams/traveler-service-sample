const Mocha = require('mocha')
const Chai = require('chai')
const ChaiHttp = require('chai-http')
const Firestore = require('../../../datastore/Firestore')
const Config = require('../../../configs/Application')
const Filter = require('../../../helpers/Filter')
const Keys = require('../../../helpers/Keys')
const ObjectsMustEqual = require('../../../helpers/ObjectsMustEqual')
const Traveler = require('../../../mockModels/Traveler')
const TravelerEmail = require('../../../mockModels/TravelerEmail')
const TravelerCopy = require('../../../mockModels/TravelerCopy')

const { describe, beforeEach, after, it } = Mocha
const { expect } = Chai
const firestore = new Firestore()
const apiVersion = '/v1'

Chai.use(ChaiHttp)

describe(`Calling PATCH /travelers/:id`, () => {
  let request
  beforeEach(async () => {
    request = Chai.request(Config.server.base + apiVersion)
  })

  after(async () => {
    await firestore.cleanup()
  })

  describe('When required params are provided', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler({ state: 'active' }).withHometown()
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
      await firestore.create([ traveler, travelerEmail ])
      const updateTraveler = new Traveler()
        .withHometown()
        .withAddress()
        .withLastLocation()
        .withPassport()
        .withIdCard()
        .withDriversLicense()
      const keys = [
        'firstName', 'lastName', 'middleName', 'interests', 'passport',
        'hometown', 'lastLocation', 'address', 'gender', 'idCard',
        'bio', 'mobile', 'nationality', 'birthPlace', 'driversLicense' ]
      const fields = Filter({ keys, object: updateTraveler.data })
      const { status, body: { data } } = await request.patch(`/travelers/${traveler.id}`).send(fields)
      expect(status).to.equal(200)
      ObjectsMustEqual({ keys, source: data, target: updateTraveler.data })
    })
  })

  describe('When traveler id does not exist', () => {
    it('Must return status code 404', async () => {
      const traveler = new Traveler({ state: 'active' }).withHometown()
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
      await firestore.create([ travelerEmail ])
      const { status } = await request.patch(`/travelers/${traveler.id}`).send({})
      expect(status).to.equal(404)
    })
  })

  describe('When traveler state is "deleted"', () => {
    it('Must return status code 406', async () => {
      const traveler = new Traveler({ state: 'deleted' }).withHometown()
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
      await firestore.create([ traveler, travelerEmail ])
      const { status } = await request.patch(`/travelers/${traveler.id}`).send({})
      expect(status).to.equal(406)
    })
  })

  describe('When traveler copy exist', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler({ state: 'active' }).withHometown()
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
      const travelerCopy = new TravelerCopy({ travelerId: traveler.id })
      await firestore.create([ traveler, travelerEmail, travelerCopy ])
      const { status, body: { data } } = await request
        .patch(`/travelers/${traveler.id}`)
        .send({ firstName: 'diego', lastName: 'armando' })
      expect(status).to.equal(200)
      ObjectsMustEqual({
        keys: Keys({ object: data, keys: ['firstName', 'lastName'], exclude: true }),
        source: data,
        target: traveler.data })
    })
  })
})

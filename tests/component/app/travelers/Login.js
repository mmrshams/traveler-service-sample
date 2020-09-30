const Mocha = require('mocha')
const Chai = require('chai')
const ChaiHttp = require('chai-http')
const Moment = require('moment')
const Firestore = require('../../../datastore/Firestore')
const Config = require('../../../configs/Application')
const GenerateCombinations = require('../../../helpers/GenerateCombinations')
const Keys = require('../../../helpers/Keys')
const Traveler = require('../../../mockModels/Traveler')
const TravelerEmail = require('../../../mockModels/TravelerEmail')
const ObjectsMustEqual = require('../../../helpers/ObjectsMustEqual')

const { describe, beforeEach, after, it } = Mocha
const { expect } = Chai
const firestore = new Firestore()
const apiVersion = '/v1'

Chai.use(ChaiHttp)

describe(`Calling PATCH /travelers/login`, () => {
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
      const travelerEmail = new TravelerEmail({ email: traveler.data.email, travelerId: traveler.id })
        .withVerification()
      const fields = { email: traveler.data.email, auth: travelerEmail.data.auth, device: traveler.data.device }
      await firestore.create([traveler, travelerEmail])
      const { status, body: { data } } = await request.patch('/travelers/login').send(fields)
      expect(status).to.equal(200)
      ObjectsMustEqual({
        keys: Keys({ object: data, keys: ['lastLogin'], exclude: true }),
        source: data,
        target: traveler.data
      })
    })
  })

  describe('When email does not match/exist', () => {
    it('Must return status code 404', async () => {
      const traveler = new Traveler({ state: 'active', health: 'clean' })
      const travelerEmail = new TravelerEmail({ email: traveler.data.email, travelerId: traveler.id })
        .withVerification()
      const fields = { email: traveler.data.email, auth: travelerEmail.data.auth, device: traveler.data.device }
      await firestore.create([traveler])
      const { status } = await request.patch('/travelers/login').send(fields)
      expect(status).to.equal(404)
    })
  })

  describe('When traveler id is not found', () => {
    it('Must return status code 404', async () => {
      const traveler = new Traveler({ state: 'active', health: 'clean' })
      const travelerEmail = new TravelerEmail({ email: traveler.data.email, travelerId: traveler.id })
        .withVerification()
      const fields = { email: traveler.data.email, auth: travelerEmail.data.auth, device: traveler.data.device }
      await firestore.create([travelerEmail])
      const { status } = await request.patch('/travelers/login').send(fields)
      expect(status).to.equal(404)
    })
  })

  describe('When email is not verified', () => {
    it('Must return status code 403', async () => {
      const traveler = new Traveler({ state: 'active', health: 'clean' })
      const travelerEmail = new TravelerEmail({
        createdAt: Moment().subtract(1, 'year').format(),
        email: traveler.data.email,
        travelerId: traveler.id
      }).withVerification({ verifiedAt: null })
      const fields = { email: traveler.data.email, auth: travelerEmail.data.auth, device: traveler.data.device }
      await firestore.create([traveler, travelerEmail])
      const { status } = await request.patch('/travelers/login').send(fields)
      expect(status).to.equal(403)
    })
  })

  describe('When health is "blocked"', () => {
    it('Must return status code 403', async () => {
      const traveler = new Traveler({ state: 'active', health: 'blocked' })
      const travelerEmail = new TravelerEmail({ email: traveler.data.email, travelerId: traveler.id })
        .withVerification()
      const fields = { email: traveler.data.email, auth: travelerEmail.data.auth, device: traveler.data.device }
      await firestore.create([traveler, travelerEmail])
      const { status } = await request.patch('/travelers/login').send(fields)
      expect(status).to.equal(403)
    })
  })

  describe('When state is not "active"', () => {
    it('Must return status code 403', async () => {
      const traveler = new Traveler({ state: 'frozen', health: 'clean' })
      const travelerEmail = new TravelerEmail({ email: traveler.data.email, travelerId: traveler.id })
        .withVerification()
      const fields = { email: traveler.data.email, auth: travelerEmail.data.auth, device: traveler.data.device }
      await firestore.create([traveler, travelerEmail])
      const { status } = await request.patch('/travelers/login').send(fields)
      expect(status).to.equal(403)
    })
  })

  describe('When any of the required fields are missing', () => {
    it('Must return status code 400', async () => {
      const traveler = new Traveler({ state: 'active', health: 'clean' })
      const travelerEmail = new TravelerEmail({ email: traveler.data.email, travelerId: traveler.id })
        .withVerification()
      const fields = { email: traveler.data.email, auth: travelerEmail.data.auth, device: traveler.data.device }
      const combinations = GenerateCombinations(fields)
      for (const combination of combinations) {
        const { status } = await request.patch('/travelers/login').send(combination)
        expect(status).to.equal(400)
      }
    })
  })
})

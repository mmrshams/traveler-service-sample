const Mocha = require('mocha')
const Chai = require('chai')
const ChaiHttp = require('chai-http')
const Firestore = require('../../../datastore/Firestore')
const Config = require('../../../configs/Application')
const Keys = require('../../../helpers/Keys')
const ObjectsMustEqual = require('../../../helpers/ObjectsMustEqual')
const UploadableImage = require('../../../helpers/UploadableImage')
const Traveler = require('../../../mockModels/Traveler')
const TravelerEmail = require('../../../mockModels/TravelerEmail')

const { describe, beforeEach, after, it } = Mocha
const { expect } = Chai
const firestore = new Firestore()
const apiVersion = '/v1'

Chai.use(ChaiHttp)

describe(`Calling PATCH /travelers/:id/avatar`, () => {
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
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
      const avatarUrl = new Traveler().withMAvatar().data.mavatar.url
      const imageFilePath = await UploadableImage(avatarUrl)
      await firestore.create([traveler, travelerEmail])
      const { status, body: { data } } = await request
        .patch(`/travelers/${traveler.id}/avatar`)
        .type('form')
        .attach('avatar', imageFilePath, 'img.jpg')
      expect(status).to.equal(200)
      expect(data.mavatar).to.exist.which.is.an('object').that.has.all.keys('publicId', 'url')
      expect(data.savatar).to.exist.which.is.an('object').that.has.all.keys('publicId', 'url')
      ObjectsMustEqual({
        keys: Keys({ object: data, keys: ['mavatar', 'savatar'], exclude: true }),
        target: data,
        source: traveler.data })
    })
  })

  describe('When traveler id is wrong', () => {
    it('Must return status code 404', async () => {
      const traveler = new Traveler({ state: 'active', health: 'reported' })
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
      const avatarUrl = new Traveler().withMAvatar().data.mavatar.url
      const imageFilePath = await UploadableImage(avatarUrl)
      await firestore.create([travelerEmail])
      const { status } = await request
        .patch(`/travelers/${traveler.id}/avatar`)
        .type('form')
        .attach('avatar', imageFilePath, 'img.jpg')
      expect(status).to.equal(404)
    })
  })

  describe('When traveler state is set to deleted', () => {
    it('Must return status code 406', async () => {
      const traveler = new Traveler({ state: 'deleted', health: 'reported' })
      const travelerEmail = new TravelerEmail({ travelerId: traveler.id, email: traveler.data.email })
      const avatarUrl = new Traveler().withMAvatar().data.mavatar.url
      const imageFilePath = await UploadableImage(avatarUrl)
      await firestore.create([traveler, travelerEmail])
      const { status } = await request
        .patch(`/travelers/${traveler.id}/avatar`)
        .type('form')
        .attach('avatar', imageFilePath, 'img.jpg')
      expect(status).to.equal(406)
    })
  })
})

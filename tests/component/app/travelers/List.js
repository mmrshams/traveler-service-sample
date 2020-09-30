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
const TravelerReports = require('../../../mockModels/TravelerReports')

const { describe, beforeEach, after, it } = Mocha
const { expect } = Chai
const firestore = new Firestore()
const apiVersion = '/v1'

Chai.use(ChaiHttp)

describe(`Calling GET /travelers`, () => {
  let request
  beforeEach(async () => {
    request = Chai.request(Config.server.base + apiVersion)
  })

  after(async () => {
    await firestore.cleanup()
  })

  describe('With a bare minimum query', () => {
    it('Must return status code 200', async () => {
      const { status } = await request.get(`/travelers`)
      expect(status).to.equal(200)
    })
  })

  describe('When state filter is set along with traveler ids', () => {
    it('Must return status code 200', async () => {
      const firstName = 'sepehr'
      const state = 'frozen'
      const traveler1 = new Traveler({ state, firstName })
      const traveler2 = new Traveler({ state: 'active', firstName })
      await firestore.create([traveler1, traveler2])
      const q = `?q=${firstName}`
      const filters = `&filter[travelerIds]=${traveler1.id},${traveler2.id}&filter[state]=${state}`
      const query = `${q}${filters}`
      await Retry(async () => {
        const { status, body: { data: { list } } } = await request.get(`/travelers${query}`)
        if (list.length < 1 ||
            !list.find(item => item.id === traveler1.id) ||
            list.find(item => item.id === traveler2.id)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: list[0] }),
          source: list,
          target: traveler1.data,
          pivot: 'id'
        })
      })
    })
  })

  describe('When state filter value is invalid', () => {
    it('Must return status code 400', async () => {
      const traveler = new Traveler()
      const query = `?q=${traveler.data.firstName}&filter[state]=WRONG`
      const { status } = await request.get(`/travelers${query}`)
      expect(status).to.equal(400)
    })
  })

  describe('When gender filter is set along with traveler ids', () => {
    it('Must return status code 200', async () => {
      const firstName = 'sepehr'
      const gender = 'male'
      const traveler1 = new Traveler({ gender, firstName })
      const traveler2 = new Traveler({ gender: 'female', firstName })
      await firestore.create([traveler1, traveler2])
      const q = `?q=${firstName}`
      const filters = `&filter[travelerIds]=${traveler1.id},${traveler2.id}&filter[gender]=${gender}`
      const query = `${q}${filters}`
      await Retry(async () => {
        const { status, body: { data: { list } } } = await request.get(`/travelers${query}`)
        if (list.length < 1 ||
            !list.find(item => item.id === traveler1.id) ||
            list.find(item => item.id === traveler2.id)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: list[0] }),
          source: list,
          target: traveler1.data,
          pivot: 'id'
        })
      })
    })
  })

  describe('When gender filter value is invalid', () => {
    it('Must return status code 400', async () => {
      const traveler = new Traveler()
      const query = `?q=${traveler.data.firstName}&filter[gender]=WRONG`
      const { status } = await request.get(`/travelers${query}`)
      expect(status).to.equal(400)
    })
  })

  describe('When health filter is set along with traveler ids', () => {
    it('Must return status code 200', async () => {
      const firstName = 'sepehr'
      const health = 'clean'
      const traveler1 = new Traveler({ health, firstName })
      const traveler2 = new Traveler({ health: 'reported', firstName })
      await firestore.create([traveler1, traveler2])
      const q = `?q=${firstName}`
      const filters = `&filter[travelerIds]=${traveler1.id},${traveler2.id}&filter[health]=${health}`
      const query = `${q}${filters}`
      await Retry(async () => {
        const { status, body: { data: { list } } } = await request.get(`/travelers${query}`)
        if (list.length < 1 ||
            !list.find(item => item.id === traveler1.id) ||
            list.find(item => item.id === traveler2.id)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: list[0] }),
          source: list,
          target: traveler1.data,
          pivot: 'id'
        })
      })
    })
  })

  describe('When health filter value is invalid', () => {
    it('Must return status code 400', async () => {
      const traveler = new Traveler()
      const query = `?q=${traveler.data.firstName}&filter[health]=WRONG`
      const { status } = await request.get(`/travelers${query}`)
      expect(status).to.equal(400)
    })
  })

  describe('When invisible filter is set along with traveler ids', () => {
    it('Must return status code 200', async () => {
      const firstName = 'sepehr'
      const invisible = true
      const traveler1 = new Traveler({ invisible, firstName })
      const traveler2 = new Traveler({ invisible: false, firstName })
      await firestore.create([traveler1, traveler2])
      const q = `?q=${firstName}`
      const filters = `&filter[travelerIds]=${traveler1.id},${traveler2.id}&filter[invisible]=${invisible}`
      const query = `${q}${filters}`
      await Retry(async () => {
        const { status, body: { data: { list } } } = await request.get(`/travelers${query}`)
        if (list.length < 1 ||
            !list.find(item => item.id === traveler1.id) ||
            list.find(item => item.id === traveler2.id)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: list[0] }),
          source: list,
          target: traveler1.data,
          pivot: 'id'
        })
      })
    })
  })

  describe('When invisible filter value is invalid', () => {
    it('Must return status code 400', async () => {
      const traveler = new Traveler()
      const query = `?q=${traveler.data.firstName}&filter[invisible]=WRONG`
      const { status } = await request.get(`/travelers${query}`)
      expect(status).to.equal(400)
    })
  })

  describe('When custom filter is set along with traveler ids', () => {
    it('Must return status code 200', async () => {
      const firstName = 'sepehr'
      const traveler1 = new Traveler({ firstName, state: 'active', health: 'clean' })
      const traveler2 = new Traveler({ firstName, state: 'deleted', health: 'clean' }) // not active
      const traveler3 = new Traveler({ firstName, state: 'active', health: 'blocked' }) // not active
      await firestore.create([traveler1, traveler2, traveler3])
      const q = `?q=${firstName}`
      const filters = `&filter[travelerIds]=${traveler1.id},${traveler2.id},${traveler3.id}&filter[custom]=active`
      const query = `${q}${filters}`
      await Retry(async () => {
        const { status, body: { data: { list } } } = await request.get(`/travelers${query}`)
        if (list.length < 1 ||
            !list.find(item => item.id === traveler1.id) ||
            list.find(item => item.id === traveler2.id)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: list[0] }),
          source: list,
          target: traveler1.data,
          pivot: 'id'
        })
      })
    })
  })

  describe('When custom filter value is invalid', () => {
    it('Must return status code 400', async () => {
      const traveler = new Traveler()
      const query = `?q=${traveler.data.firstName}&filter[custom]=WRONG`
      const { status } = await request.get(`/travelers${query}`)
      expect(status).to.equal(400)
    })
  })

  describe('When country filter is set along with traveler ids', () => {
    it('Must return status code 200', async () => {
      const firstName = 'sepehr'
      const country = 'Afghanistan'
      const traveler1 = new Traveler({ firstName }).withHometown({ country })
      const traveler2 = new Traveler({ firstName })
      await firestore.create([traveler1, traveler2])
      const q = `?q=${firstName}`
      const filters = `&filter[travelerIds]=${traveler1.id},${traveler2.id}&filter[country]=${country}`
      const query = `${q}${filters}`
      await Retry(async () => {
        const { status, body: { data: { list } } } = await request.get(`/travelers${query}`)
        if (list.length < 1 ||
            !list.find(item => item.id === traveler1.id) ||
            list.find(item => item.id === traveler2.id)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: list[0] }),
          source: list,
          target: traveler1.data,
          pivot: 'id'
        })
      })
    })
  })

  describe('When location filter is set along with traveler ids', () => {
    it('Must return status code 200', async () => {
      const firstName = 'sepehr'
      const lat = 0.11
      const lon = 0.22
      const traveler1 = new Traveler({ firstName }).withLastLocation({ lat, lon })
      const traveler2 = new Traveler({ firstName })
      await firestore.create([traveler1, traveler2])
      const q = `?q=${firstName}`
      const filters = `&filter[travelerIds]=${traveler1.id},${traveler2.id}` +
                      `&filter[location][lat]=${lat}&filter[location][lon]=${lon}`
      const query = `${q}${filters}`
      await Retry(async () => {
        const { status, body: { data: { list } } } = await request.get(`/travelers${query}`)
        if (list.length < 1 ||
            !list.find(item => item.id === traveler1.id) ||
            list.find(item => item.id === traveler2.id)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: list[0] }),
          source: list,
          target: traveler1.data,
          pivot: 'id'
        })
      })
    })
  })

  describe('When location filter is wrong', () => {
    it('Must return status code 200', async () => {
      const query = `?filter[location][X]=2&filter[location][Z]=1`
      const { status } = await request.get(`/travelers${query}`)
      expect(status).to.equal(400)
    })
  })

  describe('When channel filter is set along with traveler ids', () => {
    it('Must return status code 200', async () => {
      const firstName = 'sepehr'
      const channel = 'ios'
      const traveler1 = new Traveler({ channel, firstName })
      const traveler2 = new Traveler({ channel: 'android', firstName })
      await firestore.create([traveler1, traveler2])
      const q = `?q=${firstName}`
      const filters = `&filter[travelerIds]=${traveler1.id},${traveler2.id}&filter[channel]=${channel}`
      const query = `${q}${filters}`
      await Retry(async () => {
        const { status, body: { data: { list } } } = await request.get(`/travelers${query}`)
        if (list.length < 1 ||
            !list.find(item => item.id === traveler1.id) ||
            list.find(item => item.id === traveler2.id)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: list[0] }),
          source: list,
          target: traveler1.data,
          pivot: 'id'
        })
      })
    })
  })

  describe('When channel filter value is invalid', () => {
    it('Must return status code 400', async () => {
      const traveler = new Traveler()
      await firestore.create([traveler])
      const query = `?q=${traveler.data.firstName}&filter[channel]=WRONG`
      const { status } = await request.get(`/travelers${query}`)
      expect(status).to.equal(400)
    })
  })

  describe('When device filter is set along with traveler ids', () => {
    it('Must return status code 200', async () => {
      const firstName = 'sepehr'
      const device = 'ios'
      const traveler1 = new Traveler({ device, firstName })
      const traveler2 = new Traveler({ device: 'android', firstName })
      await firestore.create([traveler1, traveler2])
      const q = `?q=${firstName}`
      const filters = `&filter[travelerIds]=${traveler1.id},${traveler2.id}&filter[device]=${device}`
      const query = `${q}${filters}`
      await Retry(async () => {
        const { status, body: { data: { list } } } = await request.get(`/travelers${query}`)
        if (list.length < 1 ||
            !list.find(item => item.id === traveler1.id) ||
            list.find(item => item.id === traveler2.id)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: list[0] }),
          source: list,
          target: traveler1.data,
          pivot: 'id'
        })
      })
    })
  })

  describe('When device filter value is invalid', () => {
    it('Must return status code 400', async () => {
      const traveler = new Traveler()
      const query = `?q=${traveler.data.firstName}&filter[device]=WRONG`
      const { status } = await request.get(`/travelers${query}`)
      expect(status).to.equal(400)
    })
  })

  describe('When hostelId filter is set along with traveler ids', () => {
    it('Must return status code 200', async () => {
      const firstName = 'sepehr'
      const state = 'frozen'
      const traveler = new Traveler({ state, firstName })
      const travelerCopy = new TravelerCopy({ travelerId: traveler.id })
      await firestore.create([traveler, travelerCopy])
      const q = `?q=${firstName}`
      const filters = `&filter[travelerIds]=${traveler.id}` +
                      `&filter[hostelId]=${travelerCopy.data.ownerId}`
      const query = `${q}${filters}`
      await Retry(async () => {
        const { status, body: { data: { list } } } = await request.get(`/travelers${query}`)
        if (list.length < 1 || !list.find(item => item.id === traveler.id)) return false
        expect(status).to.equal(200)
        ObjectsMustEqual({
          keys: Keys({ object: list[0], keys: ['id'], exclude: true }),
          source: list[0],
          target: Object.assign({}, traveler.data, travelerCopy.data)
        })
      })
    })
  })

  describe('When viewer id is set however the viewer is invisible', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler()
      const viewer = new Traveler({ invisible: true })
      await firestore.create([traveler, viewer])
      const q = `?q=${traveler.data.email}`
      const filters = `&filter[travelerIds]=${traveler.id}&filter[viewerId]=${viewer.id}`
      const query = `${q}${filters}`
      await Retry(async () => {
        const { status, body: { data: { list } } } = await request.get(`/travelers${query}`)
        if (list.length > 1) return false
        expect(status).to.equal(200)
        expect(list).to.be.empty
      })
    })
  })

  describe('When viewer id is set and it is reported however travelersIds is also provided', () => {
    it('Must return status code 200', async () => {
      const traveler = new Traveler({ state: 'active', health: 'clean' })
      const viewer = new Traveler({ invisible: false })
      const travelerReports = new TravelerReports({ travelerId: viewer.id }).addReport()
      await firestore.create([traveler, viewer, travelerReports])
      const q = `?q=${traveler.data.email}`
      const filters = `&filter[travelerIds]=${traveler.id}&filter[viewerId]=${viewer.id}`
      const query = `${q}${filters}`
      await Retry(async () => {
        const { status, body: { data: { list } } } = await request.get(`/travelers${query}`)
        if (list.length < 1 || !list.find(item => item.id === traveler.id)) return false
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

  describe('When viewer id is set and it is reported', () => {
    it('Must return status code 200', async () => {
      const viewer = new Traveler({ invisible: false })
      const travelerReports = new TravelerReports({ travelerId: viewer.id }).addReport()
      await firestore.create([viewer, travelerReports])
      const q = `?q=${viewer.data.email}`
      const filters = `&filter[travelerIds]=${viewer.id}&filter[viewerId]=${viewer.id}`
      const query = `${q}${filters}`
      await Retry(async () => {
        const { status, body: { data: { list } } } = await request.get(`/travelers${query}`)
        if (list.length > 1) return false
        expect(status).to.equal(200)
      })
    })
  })

  describe('When viewer id is set however it does not exist', () => {
    it('Must return status code 404', async () => {
      const traveler = new Traveler()
      const viewer = new Traveler({ invisible: true })
      await firestore.create([traveler])
      const q = `?q=${traveler.data.email}`
      const filters = `&filter[travelerIds]=${traveler.id}&filter[viewerId]=${viewer.id}`
      const query = `${q}${filters}`
      const { status } = await request.get(`/travelers${query}`)
      expect(status).to.equal(404)
    })
  })

  describe('When page limit is wrong', () => {
    it('Must return status code 400', async () => {
      const { status } = await request.get(`/travelers?page[limit]=-10`)
      expect(status).to.equal(400)
    })
  })

  describe('When page offset is wrong', () => {
    it('Must return status code 400', async () => {
      const { status } = await request.get(`/travelers?page[offset]=-10`)
      expect(status).to.equal(400)
    })
  })
})

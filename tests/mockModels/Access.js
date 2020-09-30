const Faker = require('faker')
const Moment = require('moment')
const Base = require('./Base')
const BackendSimpleDate = require('../helpers/BackendSimpleDate')

const collection = 'accesses'

class Access extends Base {
  constructor ({
    id = Faker.random.uuid(),
    createdAt = Moment().format(),
    updatedAt = Moment().format(),
    travelerId = Faker.random.uuid(),
    hostelId = Faker.random.uuid(),
    requesterId = Faker.random.uuid(),
    type = 'checkIn',
    expiry = BackendSimpleDate(Moment().add(1, 'days').format()),
    status = Faker.random.arrayElement(['pending', 'accepted', 'denied'])
  } = {}) {
    super({ collection })
    this.data = {
      id,
      createdAt,
      updatedAt,
      travelerId,
      hostelId,
      requesterId,
      type,
      expiry,
      status
    }
  }
}

module.exports = Access

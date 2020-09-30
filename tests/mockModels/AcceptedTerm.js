const Faker = require('faker')
const Moment = require('moment')
const Base = require('./Base')
const BackendSimpleDate = require('../helpers/BackendSimpleDate')

const collection = 'traveler_accepted_terms'

class AcceptedTerm extends Base {
  constructor ({
    createdAt = Moment().format(),
    updatedAt = Moment().format(),
    travelerId = Faker.random.uuid(),
    hostelId = Faker.random.uuid(),
    acceptedAt = BackendSimpleDate(Moment().format()),
    signature = Faker.lorem.sentence()
  } = {}) {
    super({ collection })
    const id = `${hostelId}:${travelerId}:terms`
    this.data = {
      id,
      createdAt,
      updatedAt,
      travelerId,
      hostelId,
      acceptedAt,
      signature
    }
  }
}

module.exports = AcceptedTerm

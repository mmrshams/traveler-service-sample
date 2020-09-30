const Faker = require('faker')
const Moment = require('moment')
const Base = require('./Base')

const collection = 'traveler_emails'

class TravelerEmail extends Base {
  constructor ({
    email = Faker.internet.email(),
    createdAt = Moment().format(),
    updatedAt = Moment().format(),
    travelerId = Faker.random.uuid(),
    auth = Faker.random.uuid()
  } = {}) {
    super({ collection })
    const id = email
    this.data = { id, createdAt, updatedAt, travelerId, auth }
  }

  withVerification = ({
    code = Faker.random.uuid(),
    verifiedAt = Moment().subtract(5, 'days').format(),
    expiresAt = Moment().subtract(5, 'years').format()
  } = {}) => {
    this.data.verification = { code, verifiedAt, expiresAt }
    return this
  }

  withRecovery = ({
    pin = Faker.random.number({ min: 1000, max: 9999 }).toString(),
    retried = 0
  } = {}) => {
    this.data.recovery = { pin, retried }
    return this
  }
}

module.exports = TravelerEmail

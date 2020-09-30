const Faker = require('faker')
const Moment = require('moment')
const Base = require('./Base')
const BackendSimpleDate = require('../helpers/BackendSimpleDate')

const collection = 'traveler_copies'

class TravelerCopy extends Base {
  constructor ({
    id = Faker.random.uuid(),
    createdAt = Moment().format(),
    updatedAt = Moment().format(),
    firstName = Faker.name.firstName(),
    lastName = Faker.name.lastName(),
    email = Faker.internet.email().toLowerCase(),
    gender = Faker.random.arrayElement(['male', 'female']),
    travelerId = Faker.random.uuid(),
    ownerId = Faker.random.uuid(),
    dob = BackendSimpleDate(Moment().subtract(Faker.random.number({ min: 20, max: 40 }), 'years').format()),
    nationality = Faker.address.country(),
    mobile = Faker.phone.phoneNumber(),
    deletedAt = null
  } = {}) {
    super({ collection })
    this.data = {
      id,
      createdAt,
      updatedAt,
      firstName,
      lastName,
      email,
      gender,
      travelerId,
      ownerId,
      dob,
      nationality,
      mobile
    }
    if (deletedAt) this.deletedAt = deletedAt
  }

  withHometown = ({
    city = Faker.address.city(),
    country = Faker.address.country()
  } = {}) => {
    this.data.hometown = { city, country }
    return this
  }

  withAddress = ({
    address = Faker.address.streetAddress(),
    postCode = Faker.address.zipCode(),
    city = Faker.address.city(),
    country = Faker.address.country()
  } = {}) => {
    this.data.address = { address, postCode, city, country }
    return this
  }

  withPassport = ({
    number = Faker.random.number({ min: 10000, max: 99999 }).toString(),
    expiry = BackendSimpleDate(Moment().add(Faker.random.number({ min: 0, max: 6 }), 'months').format()),
    publicId = Faker.random.uuid()
  } = {}) => {
    this.data.password = { number, expiry, publicId }
    return this
  }

  withIdCard = ({
    number = Faker.random.number({ min: 10000, max: 99999 }).toString(),
    expiry = BackendSimpleDate(Moment().add(Faker.random.number({ min: 0, max: 6 }), 'months').format()),
    publicId = Faker.random.uuid()
  } = {}) => {
    this.data.idCard = { number, expiry, publicId }
    return this
  }

  withDriversLicense = ({
    number = Faker.random.number({ min: 10000, max: 99999 }).toString(),
    expiry = BackendSimpleDate(Moment().add(Faker.random.number({ min: 0, max: 6 }), 'months').format()),
    publicId = Faker.random.uuid()
  } = {}) => {
    this.data.driversLicense = { number, expiry, publicId }
    return this
  }
}

module.exports = TravelerCopy

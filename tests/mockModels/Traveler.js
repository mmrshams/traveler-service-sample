const Faker = require('faker')
const Moment = require('moment')
const Base = require('./Base')
const BackendSimpleDate = require('../helpers/BackendSimpleDate')

const collection = 'travelers'

class Traveler extends Base {
  constructor ({
    id = Faker.random.uuid(),
    createdAt = Moment().format(),
    updatedAt = Moment().format(),
    firstName = Faker.name.firstName(),
    middleName = Faker.name.firstName(),
    lastName = Faker.name.lastName(),
    email = Faker.internet.email().toLowerCase(),
    gender = Faker.random.arrayElement(['male', 'female']),
    bio = Faker.lorem.sentence(),
    dob = BackendSimpleDate(Moment().subtract(Faker.random.number({ min: 20, max: 40 }), 'years').format()),
    nationality = Faker.address.country(),
    birthPlace = Faker.address.city(),
    mobile = Faker.phone.phoneNumber(),
    device = Faker.random.arrayElement(['ios', 'android']),
    channel = Faker.random.arrayElement(['ios', 'android', 'tablet']),
    state = Faker.random.arrayElement(['active', 'deleted', 'frozen']),
    lastLogin = Moment().subtract(Faker.random.number({ min: 1, max: 10 }), 'days').format(),
    health = Faker.random.arrayElement(['clean', 'reported', 'blocked']),
    invisible = Faker.random.boolean(),
    interests = ['outdoor', 'adrenaline', 'cultural']
  } = {}) {
    super({ collection })
    this.data = {
      id,
      createdAt,
      updatedAt,
      firstName,
      middleName,
      lastName,
      email,
      gender,
      bio,
      dob,
      nationality,
      birthPlace,
      mobile,
      device,
      channel,
      state,
      lastLogin,
      health,
      invisible,
      interests
    }
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

  withMAvatar = ({
    // url = Faker.image.people(500, 500),
    url = Faker.internet.avatar(),
    publicId = Faker.random.uuid()
  } = {}) => {
    this.data.mavatar = { url, publicId }
    return this
  }

  withSAvatar = ({
    // url = Faker.image.people(200, 200),
    url = Faker.internet.avatar(),
    publicId = Faker.random.uuid()
  } = {}) => {
    this.data.mavatar = { url, publicId }
    return this
  }

  withLastLocation = ({
    lat = Number(Faker.address.latitude()),
    lon = Number(Faker.address.latitude())
  } = {}) => {
    this.data.lastLocation = { lat, lon }
    return this
  }

  withPassport = ({
    number = Faker.random.number({ min: 10000, max: 99999 }).toString(),
    expiry = BackendSimpleDate(Moment().add(Faker.random.number({ min: 0, max: 6 }), 'months').format()),
    publicId = Faker.random.uuid()
  } = {}) => {
    this.data.passport = { number, expiry, publicId }
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

module.exports = Traveler

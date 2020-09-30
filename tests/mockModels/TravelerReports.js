const Faker = require('faker')
const Moment = require('moment')
const Base = require('./Base')
const BackendSimpleDate = require('../helpers/BackendSimpleDate')

const collection = 'traveler_reports'

class TravelerReports extends Base {
  constructor ({
    createdAt = Moment().format(),
    updatedAt = Moment().format(),
    travelerId = Faker.random.uuid(),
    needReview = Faker.random.boolean()
  } = {}) {
    super({ collection })
    const id = `${travelerId}:reports`
    this.data = {
      id,
      createdAt,
      updatedAt,
      travelerId,
      needReview
    }
  }

  addReport = ({
    reporterId = Faker.random.uuid(),
    at = BackendSimpleDate(Moment().format()),
    reason = Faker.lorem.sentence()
  } = {}) => {
    if (!this.data.reports) {
      this.data.reports = []
    }
    this.data.reports.push({ reporterId, at, reason })
    return this
  }
}

module.exports = TravelerReports

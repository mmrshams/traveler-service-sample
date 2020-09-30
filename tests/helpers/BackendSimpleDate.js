const Moment = require('moment')

const BackendSimpleDate = (dateStr) => {
  return Moment(dateStr).format('YYYY-MM-DD')
}

module.exports = BackendSimpleDate

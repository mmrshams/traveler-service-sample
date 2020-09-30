// BaseUrls related configurations are read and joined together here

const {
  PROPERTY_HOSTELS_BASE_URL,
  PMS_RESERVATIONS_BASE_URL
} = process.env

const baseUrls = {
  property: {
    hostels: PROPERTY_HOSTELS_BASE_URL
  },
  pms: {
    reservations: PMS_RESERVATIONS_BASE_URL
  }
}

module.exports = () => baseUrls

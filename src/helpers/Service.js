import TipiServices from 'tipi-services'

const Service = ({ BaseUrlsConfig }) => {
  const settings = new TipiServices.Property.Hostels.SettingsService(BaseUrlsConfig.property.hostels)
  const reservations = new TipiServices.Pms.Reservations.ReservationsService(BaseUrlsConfig.pms.reservations)

  return {
    settings,
    reservations
  }
}

export default Service

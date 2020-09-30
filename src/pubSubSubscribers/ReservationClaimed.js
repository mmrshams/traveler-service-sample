import Joi from 'joi'

const ReservationClaimed = ({
  ServiceHelper,
  TravelerModel,
  AcceptedTermModel,
  ApplicationConfig: Config,
  PubSubSubscriberWithRedis,
  CreateTravelerCopyLogic
}) => {
  return class extends PubSubSubscriberWithRedis {
    constructor () {
      super(Config.pubSub.subscribers.reservationClaimed)
    }

    get schema () {
      return Joi.object().unknown().keys({
        reservationId: Joi.string().required(),
        guestId: Joi.string().required()
      })
    }

    async CreateDocForAcceptedTerms (reservationId) {
      const { reservationTermsIsMissing, travelerNotFound, processedSuccessfully } = this.resultStates
      const { terms, hostelId } = await ServiceHelper.reservations.details(reservationId)
      if (!terms) return { state: reservationTermsIsMissing }
      const { acceptedBy, signature } = terms
      const [ traveler ] = await TravelerModel.batchFilter({ emails: [acceptedBy] })
      if (!traveler) return { state: travelerNotFound }
      const data = { hostelId, travelerId: traveler.id }
      if (signature) data.signature = signature
      const acceptedTerms = await AcceptedTermModel.createOrOverwrite(data)
      return { state: processedSuccessfully, data: acceptedTerms }
    }

    async process ({ guestId, reservationId }) {
      let promises = []
      promises.push(CreateTravelerCopyLogic({ guestId, reservationId }))
      promises.push(this.CreateDocForAcceptedTerms(reservationId))
      const result = await Promise.all(promises)
      return result[1]
    }
  }
}

export default ReservationClaimed

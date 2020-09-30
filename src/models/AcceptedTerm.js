import { Joi } from '@gokiteam/odm/src/Validator'
import Moment from 'moment'
import { Oops } from '@gokiteam/oops'

export default ({
  Odm,
  ApplicationConfig: Config
}) => (
  class AcceptedTerms extends Odm.FirestoreWithSearch {
    RESOURCE_NAME () {
      return `${Config.envShortName}_traveler_accepted_terms`
    }

    _mask () {
      return 'id,travelerId,hostelId,acceptedAt,signature,createdAt,updatedAt'
    }

    _id () {
      const { hostelId, travelerId } = this.doc
      return AcceptedTerms._id(hostelId, travelerId)
    }

    static _id (hostelId, travelerId) {
      return `${hostelId}:${travelerId}:terms`
    }

    static get defaults () {
      return Object.freeze({
        resourceName: 'AcceptedTerms'
      })
    }

    props () {
      return {
        travelerId: {
          schema: Joi.string(),
          whiteList: true
        },
        hostelId: {
          schema: Joi.string(),
          whiteList: true
        },
        acceptedAt: {
          schema: Joi.date(),
          whiteList: true
        },
        signature: {
          schema: Joi.string(),
          whiteList: true
        }
      }
    }

    acceptTerms () {
      return this.assign({ acceptedAt: Moment().format() })
    }

    static async createOrOverwrite (data) {
      const { travelerId, hostelId } = data
      const acceptedTerms = await AcceptedTerms.tryFindByTravelerAndHostel({ travelerId, hostelId })
      if (!acceptedTerms.exists) {
        const newAcceptedTerms = new AcceptedTerms(data)
        return newAcceptedTerms.acceptTerms().create()
      } else {
        const existingAcceptedTerms = await AcceptedTerms.get(acceptedTerms.data.id)
        return existingAcceptedTerms.assign(data)
          .acceptTerms()
          .update()
      }
    }

    static async tryFindByTravelerAndHostel ({ travelerId, hostelId }) {
      const result = await AcceptedTerms.listAll({ travelerId, hostelId })
      if (result.length < 1) return { exists: false }
      return { exists: true, data: result[0] }
    }

    static async listAllByTraveler (travelerId) {
      return this.listAll({ travelerId })
    }

    static async listAll ({ travelerId, hostelId } = {}) {
      try {
        let query = AcceptedTerms.firestoreQuery
        if (travelerId) query = query.where('travelerId', '==', travelerId)
        if (hostelId) query = query.where('hostelId', '==', hostelId)
        const querySnapshot = await query.get()
        if (querySnapshot.empty) return []
        return AcceptedTerms.formatQueryResult(querySnapshot).list
      } catch (error) {
        if (error.isOops) throw error
        throw Oops.unknown('Something went wrong!').resource(AcceptedTerms.defaults.resourceName).meta(error)
      }
    }
  })

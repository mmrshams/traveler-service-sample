import { Joi } from '@gokiteam/odm/src/Validator'
import Moment from 'moment'
import { Oops } from '@gokiteam/oops'

export default ({
  Odm,
  ApplicationConfig: Config,
  AccessStatusEnum
}) => (
  class Access extends Odm.FirestoreWithSearch {
    RESOURCE_NAME () {
      return `${Config.envShortName}_accesses`
    }

    _mask () {
      return 'id,travelerId,type,requesterId,hostelId,expiry,status,createdAt,updatedAt'
    }

    static get defaults () {
      return Object.freeze({
        resourceName: 'Access',
        expirationPeriod: 2 // hours
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
        requesterId: {
          schema: Joi.string(),
          whiteList: true
        },
        type: {
          schema: Joi.string(),
          whiteList: true
        },
        expiry: {
          schema: Joi.date(),
          whiteList: true
        },
        status: {
          schema: Joi.string(),
          whiteList: true
        }
      }
    }

    async beforeCreate () {
      return this.assign({ status: AccessStatusEnum.pending }).setExpiry()
    }

    setExpiry () {
      return this.assign({ expiry: Moment().add(Access.defaults.expirationPeriod, 'h').format() })
    }

    accept () {
      if (Moment().isAfter(Moment(this.doc.expiry))) throw Oops.notAcceptable('Request is expired')
      return this.assign({ status: AccessStatusEnum.accepted })
    }

    deny () {
      return this.assign({ status: AccessStatusEnum.denied })
    }

    static async createOrOverwrite (data) {
      const { travelerId, type } = data
      const access = await Access.tryFindByTravelerAndType({ travelerId, type })
      if (!access.exists) {
        const newAccess = new Access(data)
        return newAccess.create()
      } else {
        const existingAccess = await Access.get(access.data.id)
        return existingAccess.assign(data).assign({ status: AccessStatusEnum.pending }).setExpiry().update()
      }
    }

    static async tryFindByTravelerAndType ({ travelerId, type }) {
      const result = await Access.listAll({ travelerId, type })
      if (result.length < 1) return { exists: false }
      return { exists: true, data: result[0] }
    }

    static async listAllByTraveler (travelerId) {
      return this.listAll({ travelerId })
    }

    static async listAll ({ travelerId, type, status, requesterId } = {}) {
      try {
        let query = Access.firestoreQuery
        if (travelerId) query = query.where('travelerId', '==', travelerId)
        if (requesterId) query = query.where('requesterId', '==', requesterId)
        if (type) query = query.where('type', '==', type)
        if (status) query = query.where('status', '==', status)
        const querySnapshot = await query.get()
        if (querySnapshot.empty) return []
        return Access.formatQueryResult(querySnapshot).list
      } catch (error) {
        if (error.isOops) throw error
        throw Oops.unknown('Something went wrong!').resource(Access.defaults.resourceName).meta(error)
      }
    }
  }
)

//  This is a sample model which manages data related to traveler entity

import { Joi } from '@gokiteam/odm/src/Validator'
import { Oops } from '@gokiteam/oops'
import BodyBuilder from 'bodybuilder'
import Moment from 'moment'

export default ({
  Odm,
  ApplicationConfig: Config,
  DefaultConfig,
  TravelerCopyCustomFilterEnum,
  GenderEnum
}) => (
  class TravelerCopy extends Odm.FirestoreWithSearch {
    RESOURCE_NAME () {
      return `${Config.envShortName}_traveler_copies`
    }

    _mask () {
      return 'id,firstName,lastName,email,travelerId,ownerId,hometown,passport,gender,dob,' +
        'nationality,mobile,address,idCard,driversLicense,deletedAt'
    }

    static get defaults () {
      return Object.freeze({
        resourceName: 'TravelerCopies',
        page: Object.freeze({
          offset: DefaultConfig.page.offset,
          limit: DefaultConfig.page.limit,
          allSize: 1000
        })
      })
    }

    props () {
      return {
        firstName: {
          schema: Joi.string(),
          whiteList: true
        },
        lastName: {
          schema: Joi.string(),
          whiteList: true
        },
        email: {
          schema: Joi.string(),
          whiteList: true
        },
        travelerId: {
          schema: Joi.string(),
          whiteList: true
        },
        ownerId: {
          schema: Joi.string(),
          whiteList: true
        },
        hometown: {
          schema: Joi.object().keys({
            city: Joi.string(),
            country: Joi.string()
          }),
          whiteList: true
        },
        gender: {
          schema: Joi.string().valid(...Object.values(GenderEnum)),
          whiteList: true
        },
        dob: {
          schema: Joi.date(),
          whiteList: true
        },
        nationality: {
          schema: Joi.string(),
          whiteList: true
        },
        mobile: {
          schema: Joi.string(),
          whiteList: true
        },
        address: {
          schema: Joi.object().keys({
            address: Joi.string(),
            postCode: Joi.string(),
            city: Joi.string(),
            country: Joi.string()
          }),
          whiteList: true
        },
        passport: {
          schema: Joi.object().keys({
            number: Joi.string(),
            expiry: Joi.date(),
            publicId: Joi.string()
          }),
          whiteList: true
        },
        idCard: {
          schema: Joi.object().keys({
            number: Joi.string(),
            expiry: Joi.date(),
            publicId: Joi.string()
          }),
          whiteList: true
        },
        driversLicense: {
          schema: Joi.object().keys({
            number: Joi.string(),
            expiry: Joi.date(),
            publicId: Joi.string()
          }),
          whiteList: true
        },
        deletedAt: {
          schema: Joi.date(),
          whiteList: true
        }
      }
    }

    static async listAllByTraveler (travelerId) {
      const { list } = await this.list({ filter: { travelerId }, page: { limit: this.defaults.page.allSize } })
      return list
    }

    static async list ({
      q,
      filter,
      page = {},
      mask = TravelerCopy.prototype._mask()
    } = {}) {
      try {
        const { limit = TravelerCopy.defaults.page.limit, offset = TravelerCopy.defaults.page.offset } = page
        const body = BodyBuilder()
          .size(limit)
          .from(offset * limit)
        if (q) {
          ['firstName', 'lastName', 'email'].map(field => {
            body
              .orQuery('term', `${field}.keyword`, { value: q, boost: 10 })
              .orQuery('match_phrase_prefix', field, { query: q, boost: 4 })
              .orQuery('fuzzy', field, { value: q, boost: 2 })
          })
          body.orQuery('multi_match', {
            query: q,
            type: 'cross_fields',
            fields: ['firstName', 'lastName'],
            operator: 'and'
          })
          body.queryMinimumShouldMatch(1)
        }
        if (filter) {
          const { ownerId, travelerId, custom = '', travelerIds } = filter
          if (ownerId) body.filter('term', 'ownerId', ownerId)
          if (travelerId) body.filter('term', 'travelerId', travelerId)
          if (travelerIds && travelerIds.length > 0) body.filter('terms', 'travelerId', travelerIds)
          if (custom === TravelerCopyCustomFilterEnum.shouldBeDeleted) {
            const { keepDeletedCopiesThresholdDays } = DefaultConfig.traveler
            body.query('range', 'deletedAt', {
              lt: Moment().subtract(keepDeletedCopiesThresholdDays, 'days').format()
            })
          }
        }
        return await TravelerCopy.elastic.search(body.build(), { format: true, mask })
      } catch (error) {
        if (error.isOops) throw error
        throw Oops.unknown('Something went wrong!').resource(TravelerCopy.defaults.resourceName).meta(error.toString())
      }
    }

    static async listAll (query = {}) {
      if (query.page) delete query.page
      const travelerCopies = []
      let done = false
      let offset = 0
      let limit = this.defaults.page.allSize
      while (!done) {
        const { total, list } = await this.list({
          page: { limit, offset },
          ...query
        })
        travelerCopies.push(...list)
        if (total === travelerCopies.length) {
          done = true
        } else {
          offset++
        }
      }
      return travelerCopies
    }

    setDeletedAt () {
      return this.assign({ deletedAt: Moment().format() })
    }
  }
)

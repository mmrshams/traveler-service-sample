//  This is a sample model which manages data related to traveler entity

import { Joi } from '@gokiteam/odm/src/Validator'
import Moment from 'moment'
import { Oops } from '@gokiteam/oops'
import _ from 'lodash'
import BodyBuilder from 'bodybuilder'

export default ({
  Odm,
  GenderEnum,
  DeviceEnum,
  ChannelEnum,
  StateEnum,
  HealthEnum,
  TravelerCustomFilterEnum,
  CloudinaryHelper: Cloudinary,
  ApplicationConfig: Config,
  DefaultConfig
}) => (
  class Traveler extends Odm.FirestoreWithSearch {
    RESOURCE_NAME () {
      return `${Config.envShortName}_travelers`
    }

    _mask () {
      return 'id,firstName,lastName,middleName,bio,' +
      'gender,dob,address,nationality,' +
      'birthPlace,email,hometown,mobile,lastLocation,channel,' +
      'mavatar,savatar,device,state,passport,idCard,driversLicense,health,lastLogin,invisible,interests'
    }

    static get defaults () {
      return Object.freeze({
        resourceName: 'Traveler',
        emailVerificationExpiryDue: 14,
        removeMask: ['firstName', 'lastName', 'email', 'middleName', 'address', 'passport', 'idCard',
          'driversLicense', 'mobile', 'savatar', 'mavatar', 'interests'],
        page: Object.freeze({
          offset: DefaultConfig.page.offset,
          limit: DefaultConfig.page.limit
        }),
        images: Object.freeze({
          prefix: 'traveler',
          gravity: 'center',
          crop: 'fit',
          savatar: Object.freeze({
            width: 200,
            height: 200
          }),
          mavatar: Object.freeze({
            width: 500,
            height: 500
          })
        })
      })
    }

    props () {
      return {
        firstName: {
          schema: Joi.string(),
          whiteList: true
        },
        middleName: {
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
        bio: {
          schema: Joi.string(),
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
        birthPlace: {
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
        mobile: {
          schema: Joi.string(),
          whiteList: true
        },
        mavatar: {
          schema: Joi.object().keys({
            url: Joi.string(),
            publicId: Joi.string()
          }),
          whiteList: false
        },
        savatar: {
          schema: Joi.object().keys({
            url: Joi.string(),
            publicId: Joi.string()
          }),
          whiteList: false
        },
        lastLocation: {
          schema: Joi.object().keys({
            lat: Joi.number(),
            lon: Joi.number()
          }),
          whiteList: true
        },
        device: {
          schema: Joi.string().valid(...Object.values(DeviceEnum)),
          whiteList: true
        },
        channel: {
          schema: Joi.string().valid(...Object.values(ChannelEnum)),
          whiteList: true
        },
        state: {
          schema: Joi.string().valid(...Object.values(StateEnum)),
          whiteList: false
        },
        lastLogin: {
          schema: Joi.date(),
          whiteList: false
        },
        health: {
          schema: Joi.string().valid(...Object.values(HealthEnum)),
          whiteList: false
        },
        invisible: {
          schema: Joi.boolean(),
          whiteList: false
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
        interests: {
          schema: Joi.array().items(Joi.string()),
          whiteList: true
        }
      }
    }

    async beforeCreate () {
      if (!this.doc.interests) this.assign({ interests: [] })
      return this.assign({ state: StateEnum.active, health: HealthEnum.clean, invisible: false })
    }

    async beforeSave () {
      const { dob, passport, idCard, driversLicense, interests } = this.doc
      if (this.isChanged('dob')) this.assign({ dob: Moment(dob).format() })
      if (this.isChanged('passport.expiry')) {
        this.replaceNested('passport.expiry', Moment(passport.expiry).format('YYYY-MM-DD'))
      }
      if (this.isChanged('idCard.expiry')) {
        this.replaceNested('idCard.expiry', Moment(idCard.expiry).format('YYYY-MM-DD'))
      }
      if (this.isChanged('driversLicense.expiry')) {
        this.replaceNested('driversLicense.expiry', Moment(driversLicense.expiry).format('YYYY-MM-DD'))
      }
      if (this.isChanged('interests')) this.assign({ interests: _.uniq(interests) })
      return this
    }

    getCloudinaryPublicIds () {
      const fieldsToCheck = ['passport', 'idCard', 'driversLicense', 'mavatar', 'savatar']
      let publicIds = []
      fieldsToCheck.forEach(field => {
        const { publicId } = this.doc[field] || {}
        if (publicId) publicIds.push(publicId)
      })
      return publicIds
    }

    async removeTravelerUploadedInfo () {
      try {
        const publicIds = this.getCloudinaryPublicIds()
        const promises = publicIds.map(publicId => Cloudinary.delete(publicId))
        return Promise.all(promises)
      } catch (error) {
        if (error.isOops) throw error
        throw Oops.unknown('Something went wrong!').resource(Traveler.defaults.resourceName).meta(error.toString())
      }
    }

    async setAvatar (avatar) {
      let travelerId = this.id
      const commonOptions = {
        gravity: Traveler.defaults.images.gravity,
        crop: Traveler.defaults.images.crop
      }
      const mavatarOptions = {
        public_id: `${Traveler.defaults.images.prefix}/${travelerId}/mavatar`,
        width: Traveler.defaults.images.mavatar.width,
        height: Traveler.defaults.images.mavatar.height
      }
      const savatarOptions = {
        public_id: `${Traveler.defaults.images.prefix}/${travelerId}/savatar`,
        width: Traveler.defaults.images.savatar.width,
        height: Traveler.defaults.images.savatar.height
      }
      const streamUploadResult = await Cloudinary.uploadStream(avatar, _.merge(mavatarOptions, commonOptions))
      const urlUploadResult =
        await Cloudinary.upload(streamUploadResult.secure_url, _.merge(savatarOptions, commonOptions))
      if (!streamUploadResult.secure_url || !urlUploadResult.secure_url) {
        throw Oops.internal('Something went wrong on image upload!').resource(Traveler.defaults.resourceName)
      }
      this.assign({
        mavatar: { url: streamUploadResult.secure_url, publicId: streamUploadResult.public_id },
        savatar: { url: urlUploadResult.secure_url, publicId: urlUploadResult.public_id } })
      return this
    }

    static async list ({
      q,
      filter,
      page = {},
      mask = Traveler.prototype._mask()
    } = {}) {
      const { offset = Traveler.defaults.page.offset, limit = Traveler.defaults.page.limit } = page
      const body = BodyBuilder()
        .size(limit)
        .from(offset * limit)
      if (q) {
        body
          .orQuery('wildcard', 'firstName', `${q}*`)
          .orQuery('match', 'firstName', q)
          .orQuery('wildcard', 'middleName', `${q}*`)
          .orQuery('match', 'middleName', q)
          .orQuery('wildcard', 'lastName', `${q}*`)
          .orQuery('match', 'lastName', q)
          .orQuery('match', 'email', q.toLowerCase())
          .queryMinimumShouldMatch(1)
      }
      if (filter) {
        const { state, device, channel, health, invisible, gender,
          travelerIds, country, custom, excludeIds, location, interests, viewerId } = filter
        if (state) body.filter('term', 'state', state)
        if (device) body.filter('term', 'device', device)
        if (channel) body.filter('term', 'channel', channel)
        if (health) body.filter('term', 'health', health)
        if (_.isBoolean(invisible)) body.filter('term', 'invisible', invisible)
        if (gender) body.filter('term', 'gender', gender)
        if (country) body.filter('term', 'hometown.country.keyword', country)
        if (interests) body.filter('terms', 'interests.keyword', interests)
        if (location) {
          body.filter('geo_distance', { 'distance': DefaultConfig.distance.close, 'lastLocation': location })
        }
        if (travelerIds && travelerIds.length > 0) body.filter('terms', 'id', travelerIds)
        if (excludeIds && excludeIds.length > 0) body.notFilter('terms', 'id', excludeIds)
        if (viewerId || custom === TravelerCustomFilterEnum.active) {
          body.notFilter('term', 'health', HealthEnum.blocked)
          body.filter('term', 'state', StateEnum.active)
        }
        if (viewerId) {
          body.filter('bool', (q) => {
            return q
              .orFilter('term', 'id', viewerId)
              .orFilter('term', 'invisible', false)
              .filterMinimumShouldMatch(1)
          })
        }
      }
      const query = body.build()
      return this.searchOnElastic({ query, options: { format: true, mask } })
    }

    static async batchDetails ({ ids, asObject = false, activeTravelers = false, withMissedItems = false } = {}) {
      const body = BodyBuilder()
        .size(ids.length)
        .filter('terms', 'id', ids)
      if (activeTravelers) {
        body.notFilter('term', 'health', HealthEnum.blocked)
          .filter('term', 'state', StateEnum.active)
      }
      const query = body.build()
      const travelers = await this.searchOnElastic({ query, options: { mask: Traveler.prototype._mask() } })
      return this.getBatchDetailsResult({ ids, travelers, asObject, withMissedItems })
    }

    static async batchDetailsForViewer ({ ids, excludeIds, asObject = false, withMissedItems = false, viewerId }) {
      const viewer = await this.find(viewerId)
      if (viewer.invisible) {
        const travelers = ids.indexOf(viewerId) >= 0 ? [viewer] : []
        return this.getBatchDetailsResult({ ids, travelers, asObject, withMissedItems })
      }
      const body = BodyBuilder()
        .size(ids.length)
        .filter('terms', 'id', ids)
        .notFilter('term', 'health', HealthEnum.blocked)
        .filter('term', 'state', StateEnum.active)
        .filter('term', 'invisible', false)
      if (excludeIds?.length) body.notFilter('terms', 'id', excludeIds)
      const query = body.build()
      const travelers = await this.searchOnElastic({ query, options: { mask: Traveler.prototype._mask() } })
      return this.getBatchDetailsResult({ ids, travelers, asObject, withMissedItems })
    }

    static async searchOnElastic ({ query, options }) {
      try {
        return await Traveler.elastic.search(query, options)
      } catch (error) {
        if (error.isOops) throw error
        throw Oops.unknown('Something went wrong!').resource(Traveler.defaults.resourceName).meta(error.toString())
      }
    }

    static getBatchDetailsResult ({ ids, travelers, asObject, withMissedItems, idField = 'id' }) {
      const travelersObj = {}
      travelers.map(traveler => { travelersObj[traveler[idField]] = traveler })
      const sortedList = []
      ids.map(id => {
        if (!travelersObj[id] && withMissedItems) travelersObj[id] = null
        if (withMissedItems) sortedList.push(travelersObj[id])
        else if (travelersObj[id]) sortedList.push(travelersObj[id])
      })
      return asObject ? travelersObj : sortedList
    }

    static async batchFilter ({ emails, asObject = false, activeTravelers = true, withMissedItems = false } = {}) {
      const body = BodyBuilder()
        .size(emails.length)
        .filter('terms', 'email.keyword', emails)
      if (activeTravelers) {
        body.notFilter('term', 'health', HealthEnum.blocked)
          .filter('term', 'state', StateEnum.active)
      }
      try {
        const travelers = await Traveler.elastic.search(body.build(), { mask: Traveler.prototype._mask() })
        return this.getBatchDetailsResult({ ids: emails, travelers, asObject, withMissedItems, idField: 'email' })
      } catch (error) {
        if (error.isOops) throw error
        throw Oops.unknown('Something went wrong!').resource(Traveler.defaults.resourceName).meta(error.toString())
      }
    }
  }
)

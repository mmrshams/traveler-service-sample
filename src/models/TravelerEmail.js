
//  This is a sample model which manages data related to travelerEmail entity

import { Joi } from '@gokiteam/odm/src/Validator'
import IdGenerator from 'uuid'
import { Oops } from '@gokiteam/oops'
import Moment from 'moment'

export default ({
  Odm,
  ApplicationConfig: Config,
  DefaultConfig
}) => (
  class TravelerEmail extends Odm.FirestoreWithSearch {
    RESOURCE_NAME () {
      return `${Config.envShortName}_traveler_emails`
    }

    _mask () {
      return 'id,travelerId,auth'
    }

    _id () {
      return TravelerEmail._id(this.id)
    }

    static _id (email) {
      return email.toLowerCase()
    }

    static get defaults () {
      return Object.freeze({
        resourceName: 'TravelerEmail',
        emailVerificationExpiryDue: 14,
        verificationCode: Object.freeze({
          statuses: Object.freeze({
            verified: 'verified',
            valid: 'valid',
            incorrect: 'incorrect',
            expired: 'expired'
          }),
          renewThreshold: 2
        }),
        page: Object.freeze({
          offset: DefaultConfig.page.offset,
          limit: DefaultConfig.page.limit
        }),
        emails: Object.freeze({
          triggerEvents: Object.freeze({
            pin: 'pin',
            verification: 'user_verification'
          })
        })
      })
    }

    props () {
      return {
        travelerId: {
          schema: Joi.string(),
          whiteList: true
        },
        auth: {
          schema: Joi.string(),
          whiteList: true
        },
        recovery: {
          schema: Joi.object(),
          whiteList: false
        },
        verification: {
          schema: Joi.object(),
          whiteList: false
        }
      }
    }

    async beforeCreate () {
      return this.assign({ auth: IdGenerator.v4() }).setVerification()
    }

    static async getByEmail (email) {
      return TravelerEmail.get(TravelerEmail._id(email))
    }

    static async getByTravelerId (travelerId) {
      const querySnapshot = await this.firestoreQuery.where('travelerId', '==', travelerId).get()
      if (querySnapshot.empty) throw Oops.notFound(`Document with id: ${travelerId} not found!`)
      const { list } = TravelerEmail.formatQueryResult(querySnapshot)
      return list[0]
    }

    setPin () {
      let min = 999
      let max = 10000
      const pin = Math.floor(Math.random() * (max - min + 1) + min).toString()
      return this.replace({ recovery: { pin, retried: 0 } })
    }

    async verifyPin (pin) {
      try {
        const { recovery } = this.doc
        if (!recovery) throw Oops.unauthorized('wrong pin!').resource(TravelerEmail.defaults.resourceName)
        if (recovery.pin !== pin) {
          recovery.retried += 1
          if (recovery.retried >= 3) {
            await this.removeProps(['recovery']).update()
            throw Oops.unauthorized('wrong pin!').resource(TravelerEmail.defaults.resourceName)
          }
          await this.replace({ recovery }).update()
          throw Oops.unauthorized('wrong pin!').resource(TravelerEmail.defaults.resourceName)
        }
        this.removeProps(['recovery'])
        if (!this.isVerified()) {
          // verify email during recovery account
          this.assign({ verification: { verifiedAt: Moment().format() } })
        }
        await this.update()
        return this.mask()
      } catch (error) {
        if (error.isOops) throw error
        throw Oops.unknown('Something went wrong!').resource(TravelerEmail.defaults.resourceName).meta(error.toString())
      }
    }

    getVerificationCodeStatus (code) {
      const { verification } = this.doc
      if (verification.code !== code) return TravelerEmail.defaults.verificationCode.statuses.incorrect
      if (verification.verifiedAt !== null) return TravelerEmail.defaults.verificationCode.statuses.verified
      if (Moment().isAfter(verification.expiresAt)) {
        return TravelerEmail.defaults.verificationCode.statuses.expired
      }
      return TravelerEmail.defaults.verificationCode.statuses.valid
    }

    setVerification () {
      return this.replace({
        verification: {
          code: IdGenerator.v4(),
          expiresAt: Moment().add(TravelerEmail.defaults.emailVerificationExpiryDue, 'day').format(),
          verifiedAt: null
        }
      })
    }

    isTrialExpired () {
      return Moment().isAfter(Moment(this.doc.createdAt).add(TravelerEmail.defaults.emailVerificationExpiryDue, 'day'))
    }

    isVerified () {
      return this.doc.verification.verifiedAt !== null
    }

    checkAuthorization (auth) {
      if (this.doc.auth !== auth) {
        throw Oops.unauthorized('Wrong authentication token!').resource(TravelerEmail.defaults.resourceName)
      }
      return true
    }
  }
)

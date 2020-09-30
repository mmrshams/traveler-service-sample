
//  This is a sample model which manages data related to travelerEmail entity

import { Joi } from '@gokiteam/odm/src/Validator'
import { Oops } from '@gokiteam/oops'
import Moment from 'moment'
import BodyBuilder from 'bodybuilder'
import _ from 'lodash'

export default ({
  Odm,
  ApplicationConfig: Config,
  DefaultConfig
}) => (
  class TravelerReports extends Odm.FirestoreWithSearch {
    RESOURCE_NAME () {
      return `${Config.envShortName}_traveler_reports`
    }

    _mask () {
      return 'id,travelerId,reports,needReview,createdAt,updatedAt'
    }

    static get defaults () {
      return Object.freeze({
        resourceName: 'TravelerReports',
        sortableFields: Object.freeze(['createdAt', 'updatedAt']),
        page: Object.freeze({
          offset: DefaultConfig.page.offset,
          limit: DefaultConfig.page.limit,
          all: 2000
        })
      })
    }

    _id () {
      return TravelerReports._id(this.doc.travelerId)
    }

    static _id (travelerId) {
      return `${travelerId}:reports`
    }

    props () {
      return {
        travelerId: {
          schema: Joi.string(),
          whiteList: true
        },
        reports: {
          schema: Joi.array().items(Joi.object().keys({
            reporterId: Joi.string(),
            at: Joi.date(),
            reason: Joi.string()
          })),
          whiteList: false
        },
        needReview: {
          schema: Joi.boolean(),
          whiteList: true
        }
      }
    }

    async beforeCreate () {
      if (!this.doc.reports) this.assign({ reports: [] })
      return this.assign({ needReview: false })
    }

    static async tryGetByTraveler (travelerId) {
      try {
        const id = TravelerReports._id(travelerId)
        const reportData = await this.elastic.get(id)
        const instance = new TravelerReports(reportData, id, true)
        return { exists: true, instance }
      } catch (e) {
        return { exists: false }
      }
    }

    static async list ({
      filter,
      sort = [],
      page: { limit = TravelerReports.defaults.page.limit, offset = TravelerReports.defaults.page.offset } = {},
      mask = TravelerReports.prototype._mask()
    } = {}) {
      try {
        const body = BodyBuilder()
          .size(limit)
          .from(offset * limit)
        if (filter) {
          const { travelerId, needReview, travelerIdOrReporterId, reporterId } = filter
          if (travelerId) body.filter('term', 'travelerId', travelerId)
          if (reporterId) body.filter('term', 'reports.reporterId', reporterId)
          if (needReview !== undefined) {
            body.filter('term', 'needReview', needReview)
          }
          if (travelerIdOrReporterId) {
            body.orFilter('term', 'reports.reporterId', travelerIdOrReporterId)
              .orFilter('term', 'travelerId', travelerIdOrReporterId)
          }
        }
        if (sort.length) {
          sort.forEach(item => {
            const { field, order } = item
            body.sort(field, order)
          })
        }
        return await TravelerReports.elastic.search(body.build(), { format: true, mask })
      } catch (error) {
        if (error.isOops) throw error
        throw Oops.unknown('Something went wrong!')
          .resource(TravelerReports.defaults.resourceName).meta(error.toString())
      }
    }

    addReport ({ reporterId, reason }) {
      const { reports = [] } = this.doc
      const reportAlreadyExists = _.find(reports, { reporterId })
      if (reportAlreadyExists) {
        throw Oops.alreadyExists('you reported this traveler before')
      }
      const reportObject = {
        reporterId,
        at: new Moment().format(),
        ...reason && {
          reason
        }
      }
      reports.push(reportObject)
      this.assign({ reports })
      if (reports.length >= DefaultConfig.report.needReviewThreshold) this.assign({ needReview: true })
      return this
    }
  })

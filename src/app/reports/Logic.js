// This module includes all logic related to travelers resource
import { Oops } from '@gokiteam/oops'
import _ from 'lodash'

const Logic = ({
  Odm,
  TravelerModel,
  HealthEnum,
  TravelerReportsModel,
  ReportsListingExtendEnum,
  PubSubPublishHelper,
  ApplicationConfig: Config
}) => {
  const publicMethods = {
    async createOrUpdate ({ travelerId, reporterId, reason }) {
      if (reporterId === travelerId) throw Oops.notAcceptable('you can not report yourself!')
      const transactionHandler = new Odm.FirestoreTransactionHandler()
      let { exists, instance } = await TravelerReportsModel.tryGetByTraveler(travelerId)
      transactionHandler.queueToGet(TravelerModel, travelerId)
      if (exists) {
        transactionHandler.queueToGet(TravelerReportsModel, instance.id)
      }
      transactionHandler.getAll(([traveler, report]) => {
        if (report) {
          report.addReport({ reporterId, reason })
          transactionHandler.update(report)
        } else {
          const travelerReport = new TravelerReportsModel({ travelerId })
          travelerReport.addReport({ reporterId, reason })
          transactionHandler.create(travelerReport)
        }
        traveler.assign({ health: HealthEnum.reported })
        transactionHandler.update(traveler)
      })
      await transactionHandler.run()
      PubSubPublishHelper.publish({
        topic: Config.pubSub.topics.travelerHealthStateChanged,
        data: {
          travelerId, health: HealthEnum.reported, reporterId
        }
      })
    },
    async list (query) {
      const reports = await TravelerReportsModel.list(query)
      const { extend } = query
      let travelerIds = []
      if (extend && extend.indexOf(ReportsListingExtendEnum.traveler) !== -1) {
        reports.list.map((report, i) => {
          travelerIds.push(report.travelerId)
          report.reports.map(report_ => {
            travelerIds.push(report_.reporterId)
          })
        })
        travelerIds = _.uniq(travelerIds)
        const travelers = await TravelerModel.batchDetails({ ids: travelerIds, asObject: true, withMissedItems: true })
        reports.list.map((report, i) => {
          report.traveler = travelers[report.travelerId]
          report.reports.map(reporter => {
            reporter.reporter = travelers[reporter.reporterId]
          })
        })
      }
      return reports
    }
  }
  return publicMethods
}

export default Logic

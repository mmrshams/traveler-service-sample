import _ from 'lodash'

const FindReportedTravelerIds = ({
  TravelerReportsModel
}) => {
  return async (id) => {
    if (!id) return []
    const { list } = await TravelerReportsModel.list({
      filter: {
        travelerIdOrReporterId: id
      },
      page: {
        limit: TravelerReportsModel.defaults.page.all,
        offset: TravelerReportsModel.defaults.page.offset
      }
    })

    const ids = []
    list.map(travelerReport => {
      const { travelerId: reportedId, reports = [] } = travelerReport
      if (reportedId === id) {
        reports.map(report => {
          ids.push(report.reporterId)
        })
      } else {
        ids.push(reportedId)
      }
    })
    return _.uniq(ids)
  }
}

export default FindReportedTravelerIds

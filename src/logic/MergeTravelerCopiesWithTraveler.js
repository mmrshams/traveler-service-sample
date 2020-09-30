import _ from 'lodash'
import { Oops } from '@gokiteam/oops'

const MergeTravelerCopiesWithTraveler = ({ TravelerCopyModel }) => {
  const methods = {
    mergeTravelerCopyToTraveler ({ traveler = {}, copy = {} }) {
      delete copy.travelerId
      delete copy.id
      return { ...traveler, ...copy }
    }
  }
  return async ({ travelers = [], hostelId, isObject = false }) => {
    if (isObject && !_.isObject(travelers)) throw Oops.invalidArgument('travelers must be an object')
    if (!isObject && !_.isArray(travelers)) throw Oops.invalidArgument('travelers must be an array')
    if (!isObject && !travelers.length) return []
    const travelerIds = _.map(travelers, traveler => traveler?.id).filter(id => id)
    let { list: copies } = await TravelerCopyModel.list({
      page: { limit: travelerIds.length },
      filter: {
        travelerIds: travelerIds,
        ownerId: hostelId
      }
    })
    const copiesObject = _.keyBy(copies, 'travelerId')
    _.map(travelers, (traveler, key) => {
      const copy = copiesObject[traveler?.id]
      if (copy) travelers[key] = methods.mergeTravelerCopyToTraveler({ copy, traveler })
    })
    return travelers
  }
}

export default MergeTravelerCopiesWithTraveler

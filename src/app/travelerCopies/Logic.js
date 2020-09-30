import _ from 'lodash'

const Logic = ({ TravelerModel, TravelerCopyModel }) => {
  const publicMethods = {
    async list (query) {
      let { list, total } = await TravelerCopyModel.list(query)
      if (list.length) {
        const ids = list.map(({ travelerId }) => travelerId)
        const travelerObject = await TravelerModel.batchDetails({ ids: _.uniq(ids), asObject: true })
        list = list.map(copy => {
          const traveler = travelerObject[copy.travelerId]
          delete copy.travelerId
          delete copy.id
          return {
            ...traveler,
            ...copy
          }
        })
      }
      return { list, total }
    }
  }
  return publicMethods
}

export default Logic

const BatchPruneTravelerCopyRequired = ({
  TravelerCopyModel,
  TravelerCopyCustomFilterEnum,
  ApplicationConfig: Config,
  PubSubPublishHelper
}) => {
  return async () => {
    const deletedTravelerCopies = []
    const travelerCopies = await TravelerCopyModel.listAll({
      filter: {
        custom: TravelerCopyCustomFilterEnum.shouldBeDeleted
      }
    })
    for await (let travelerCopy of travelerCopies) {
      try {
        await TravelerCopyModel.remove(travelerCopy.id)
        if (travelerCopy.email) {
          deletedTravelerCopies.push({
            email: travelerCopy.email,
            hostelId: travelerCopy.ownerId
          })
        }
      } catch (error) {
        const { id: travelerCopyId, email, ownerId: hostelId } = travelerCopy
        PubSubPublishHelper.publish({ topic: Config.pubSub.topics.pruneTravelerCopyRequired,
          data: { travelerCopyId, email, hostelId }
        })
      }
    }
    if (deletedTravelerCopies.length) {
      PubSubPublishHelper.publish({ topic: Config.pubSub.topics.batchTravelerCopyRemoved,
        data: {
          travelers: deletedTravelerCopies
        }
      })
    }
    return true
  }
}

export default BatchPruneTravelerCopyRequired

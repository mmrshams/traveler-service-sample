// This module includes all logic related to travelers resource
import { Oops } from '@gokiteam/oops'
import Moment from 'moment'
import _ from 'lodash'

const Logic = ({
  ApplicationConfig: Config,
  Odm,
  TravelerEmailModel,
  TravelerModel,
  TravelerCopyModel,
  AccessModel,
  StateEnum,
  HealthEnum,
  ErrorReasonEnum,
  PubSubPublishHelper,
  TravelerReportsModel,
  FindReportedTravelerIdsLogic,
  ServiceHelper,
  ExtendEnum,
  AcceptedTermModel,
  MergeTravelerCopiesWithTravelerLogic
}) => {
  const privateMethods = {
    async decorateWithAuth (travelerEmail) {
      const data = await TravelerModel.find(travelerEmail.doc.travelerId)
      data.auth = travelerEmail.doc.auth
      return data
    },
    getBatchHostelSettingsAsObject (hostelIds = []) {
      if (Array.isArray(hostelIds) && hostelIds.length) {
        return ServiceHelper.settings.batchDetails({
          ids: hostelIds.join(','),
          asObject: true,
          findByHostelId: true
        })
      }
      return {}
    }
  }
  const publicMethods = {
    async signup (data) {
      const { email } = data
      const traveler = new TravelerModel(data)
      const travelerEmail = new TravelerEmailModel({ travelerId: traveler.doc.id }, email)
      const transactionHandler = new Odm.FirestoreTransactionHandler()
      await transactionHandler
        .create(traveler)
        .create(travelerEmail)
        .run()
      const { verification, auth } = travelerEmail.doc
      const responseData = traveler.mask()
      PubSubPublishHelper.publish({ topic: Config.pubSub.topics.travelerJoined, data: { traveler: responseData } })
      PubSubPublishHelper.publish({
        topic: Config.pubSub.topics.travelerVerificationRequired,
        data: { traveler: responseData, verification }
      })
      responseData.auth = auth
      return responseData
    },
    async login (data) {
      const { email, auth, device } = data
      const travelerEmail = await TravelerEmailModel.getByEmail(email)
      const traveler = await TravelerModel.get(travelerEmail.doc.travelerId)
      if (!travelerEmail.isVerified() && travelerEmail.isTrialExpired()) {
        throw Oops.permissionDenied('Account is not verified please verify your account first!')
          .reason(ErrorReasonEnum.accountIsNotVerified)
      }
      if (traveler.doc.health === HealthEnum.blocked) {
        throw Oops.permissionDenied('Your account banned for some reasons!').reason(ErrorReasonEnum.accountIsBlocked)
      }
      if (traveler.doc.state !== StateEnum.active) throw Oops.permissionDenied('Your account not active anymore')
      await travelerEmail.checkAuthorization(auth)
      await traveler.assign({ lastLogin: Moment().format(), device }).update()
      return traveler.mask()
    },
    async verifyPin (data) {
      const { pin, email } = data
      const travelerEmail = await TravelerEmailModel.getByEmail(email)
      await travelerEmail.verifyPin(pin)
      const responseData = await privateMethods.decorateWithAuth(travelerEmail)
      return responseData
    },
    async verify (data) {
      const { email, verificationCode } = data
      const travelerEmail = await TravelerEmailModel.getByEmail(email)
      const verificationCodeState = travelerEmail.getVerificationCodeStatus(verificationCode)
      if (verificationCodeState === TravelerEmailModel.defaults.verificationCode.statuses.incorrect) {
        throw Oops.notAcceptable('Incorrect code!')
      } else if (verificationCodeState === TravelerEmailModel.defaults.verificationCode.statuses.expired) {
        await travelerEmail.setVerification().update()
        const { travelerId, verification } = travelerEmail.doc
        const traveler = await TravelerModel.find(travelerId)
        PubSubPublishHelper
          .publish({ topic: Config.pubSub.topics.travelerVerificationRequired, data: { traveler, verification } })
        throw Oops.permissionDenied('Code is expired')
      } else {
        if (travelerEmail.isVerified()) throw Oops.permissionDenied('Your account verified before!')
        await travelerEmail.assign({ verification: { verifiedAt: Moment().format() } }).update()
        const responseData = await privateMethods.decorateWithAuth(travelerEmail)
        return responseData
      }
    },
    async remove (id) {
      const travelerDoc = await TravelerModel.get(id)
      if (travelerDoc.doc.state === StateEnum.deleted) return true
      const { email } = travelerDoc.doc
      await travelerDoc.removeTravelerUploadedInfo()
      const travelerCopies = await TravelerCopyModel.listAllByTraveler(id)
      const accesses = await AccessModel.listAllByTraveler(id)
      const transactionHandler = new Odm.FirestoreTransactionHandler()
      const hostelIds = _.uniq(travelerCopies.map(({ ownerId }) => ownerId))
      const hostelSettingsObject = await privateMethods.getBatchHostelSettingsAsObject(hostelIds)
      let deletedTravelerCopies = []
      transactionHandler.queueToGet(TravelerModel, id)
      travelerCopies.map(travelerCopy => {
        const { keepTravelerInfoAfterRemove } = hostelSettingsObject[travelerCopy.ownerId]
        if (keepTravelerInfoAfterRemove) {
          transactionHandler.queueToGet(TravelerCopyModel, travelerCopy.id)
        } else {
          if (travelerCopy.email) {
            deletedTravelerCopies.push({
              email: travelerCopy.email,
              hostelId: travelerCopy.ownerId
            })
          }
          transactionHandler.delete(TravelerCopyModel.firestoreDocRef(travelerCopy.id))
        }
      })
      await transactionHandler
        .getAll(([ traveler, ...travelerCopiesTransaction ]) => {
          if (travelerCopiesTransaction) {
            travelerCopiesTransaction.map(travelerCopy => {
              travelerCopy.setDeletedAt()
              transactionHandler.update(travelerCopy)
            })
          }
          traveler.removeProps(TravelerModel.defaults.removeMask).assign({ state: StateEnum.deleted })
          transactionHandler.update(traveler)
          accesses.forEach(access => {
            transactionHandler.delete(AccessModel.firestoreDocRef(access.id))
          })
          transactionHandler.delete(TravelerEmailModel.firestoreDocRef(email))
        }).run()
      if (deletedTravelerCopies.length) {
        PubSubPublishHelper.publish({ topic: Config.pubSub.topics.batchTravelerCopyRemoved,
          data: {
            travelers: deletedTravelerCopies
          }
        })
      }
      PubSubPublishHelper.publish({ topic: Config.pubSub.topics.travelerRemoved, data: { id, email } })
      return true
    },
    async list (query) {
      const { filter: { viewerId, hostelId } = {} } = query
      if (viewerId) {
        const { invisible: invisibleViewer } = await TravelerModel.find(viewerId)
        if (invisibleViewer) return { list: [], total: 0 }
        const reportedTravelerIds = await FindReportedTravelerIdsLogic(viewerId)
        if (reportedTravelerIds.length) {
          query.filter.excludeIds = reportedTravelerIds
        }
      }
      const response = await TravelerModel.list(query)
      if (hostelId) {
        response.list = await MergeTravelerCopiesWithTravelerLogic({ travelers: response.list, hostelId })
      }
      return response
    },
    async update ({ id, data }) {
      const traveler = await TravelerModel.get(id)
      if (traveler.doc.state === StateEnum.deleted) throw Oops.notAcceptable('The traveler is deleted.')
      const { firstName, lastName } = data
      if (!firstName && !lastName) return traveler.assign(data).update()
      let updatedTraveler
      const travelerCopyList = await TravelerCopyModel.list({ filter: { travelerId: id } })
      if (travelerCopyList.list.length < 1) return traveler.assign(data).update()
      const transactionHandler = new Odm.FirestoreTransactionHandler()
      transactionHandler.queueToGet(TravelerModel, id)
      travelerCopyList.list.forEach(travelerCopy => {
        transactionHandler.queueToGet(TravelerCopyModel, travelerCopy.id)
      })
      updatedTraveler = await transactionHandler.getAll(([ traveler, ...travelerCopies ]) => {
        traveler.assign(data)
        transactionHandler.update(traveler)
        travelerCopies.forEach(travelerCopy => {
          if (lastName) travelerCopy.assign({ lastName })
          if (firstName) travelerCopy.assign({ firstName })
          transactionHandler.update(travelerCopy)
        })
      }).run()
      return updatedTraveler[0].mask()
    },
    async updateHealth ({ travelerId, health }) {
      const transactionHandler = new Odm.FirestoreTransactionHandler()
      const { exists, instance } = await TravelerReportsModel.tryGetByTraveler(travelerId)
      transactionHandler.queueToGet(TravelerModel, travelerId)
      if (exists) {
        transactionHandler.queueToGet(TravelerReportsModel, instance.id)
      }
      transactionHandler.getAll(([traveler, travelerReport]) => {
        traveler.assign({ health })
        transactionHandler.update(traveler)
        if (travelerReport) {
          if (health === HealthEnum.clean) {
            transactionHandler.delete(TravelerReportsModel.firestoreDocRef(travelerReport.id))
          } else {
            travelerReport.assign({ needReview: false })
            transactionHandler.update(travelerReport)
          }
        }
      })
      const [updatedTraveler] = await transactionHandler.run()
      PubSubPublishHelper.publish({
        topic: Config.pubSub.topics.travelerHealthStateChanged, data: { travelerId, health }
      })
      return updatedTraveler.mask()
    },
    async batchDetails (query) {
      const { ids, asObject = false, activeTravelers = false, withMissedItems = false, viewerId, hostelId } = query
      let travelers
      if (viewerId) {
        const excludeIds = await FindReportedTravelerIdsLogic(viewerId)
        travelers = await TravelerModel.batchDetailsForViewer({ ids, excludeIds, asObject, withMissedItems, viewerId })
      } else {
        travelers = await TravelerModel.batchDetails({ ids, asObject, withMissedItems, activeTravelers })
        if (hostelId) {
          travelers = await MergeTravelerCopiesWithTravelerLogic({ hostelId, travelers, isObject: asObject })
        }
      }
      return travelers
    },
    async details ({ id, query: { viewerId, extend, filter: { hostelId } = {} } = {} }) {
      // no need to filter response because traveler is always visible to herself
      if (id === viewerId) viewerId = null
      if (viewerId) {
        const { invisible: invisibleViewer } = await TravelerModel.find(viewerId)
        if (invisibleViewer) throw Oops.notFound('traveler not found')
        const reportedTravelerIds = await FindReportedTravelerIdsLogic(viewerId)
        if (reportedTravelerIds.indexOf(id) !== -1) {
          throw Oops.notFound('traveler not found')
        }
      }
      let traveler = await TravelerModel.elastic.get(id)
      if (viewerId) {
        const { invisible, state, health } = traveler
        if (invisible || state !== StateEnum.active || health === HealthEnum.blocked) {
          throw Oops.notFound('traveler not found')
        }
      }
      if (hostelId) {
        const [ mergedTraveler ] = await MergeTravelerCopiesWithTravelerLogic({ hostelId, travelers: [traveler] })
        traveler = mergedTraveler
      }
      if (extend && extend.indexOf(ExtendEnum.acceptedTerms) >= 0) {
        traveler.acceptedTerms = await AcceptedTermModel.listAllByTraveler(traveler.id)
      }
      return traveler
    }
  }

  return publicMethods
}

export default Logic

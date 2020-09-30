import _ from 'lodash'

const CreateTravelerCopy = ({
  TravelerCopyModel,
  TravelerModel,
  ServiceHelper
}) => {
  return async ({ guestId = null, reservationId }) => {
    const { mainCustomer = {}, hostelId, mainGuestId } =
      await ServiceHelper.reservations.details(reservationId)
    // No need to create traveler copy if the reservation is not claimed by any Goki traveler
    if (!mainGuestId) return false
    // When gustId is not given, we assume that copy should be created for main guest
    if (!guestId) guestId = mainGuestId
    const traveler = await TravelerModel.get(guestId)
    const mainCustomerInfo = _.pick(mainCustomer, [
      'passport', 'idCard', 'driversLicense', 'hometown', 'dob', 'mobile', 'nationality', 'gender'
    ])
    if (mainCustomer.address) mainCustomerInfo.address = { address: mainCustomer.address }
    let travelerInfo = _.pick(traveler.doc, [
      'firstName', 'lastName', 'email', 'hometown', 'dob', 'mobile', 'nationality', 'address',
      'gender', 'passport', 'idCard', 'driversLicense'
    ])
    if (traveler.doc.email === mainCustomer.email) {
      travelerInfo = {
        ...travelerInfo,
        ...mainCustomerInfo
      }
    }
    const querySnapshot = await TravelerCopyModel.firestoreQuery
      .where('travelerId', '==', guestId)
      .where('ownerId', '==', hostelId).get()
    if (querySnapshot.empty) {
      const travelerCopy = new TravelerCopyModel({
        ownerId: hostelId,
        travelerId: guestId,
        ...travelerInfo
      })
      return travelerCopy.create()
    } else {
      const instance = TravelerCopyModel.createInstanceFromFirestoreDocumentSnapshot(querySnapshot.docs[0])
      return instance.assign(travelerInfo).update()
    }
  }
}
export default CreateTravelerCopy

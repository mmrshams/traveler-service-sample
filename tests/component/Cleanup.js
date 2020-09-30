const Firestore = require('../datastore/Firestore')
const {
  AcceptedTerm,
  Access,
  TravelerCopy,
  TravelerEmail,
  Traveler,
  TravelerReports
} = require('../mockModels/Index')

const Cleanup = async () => {
  const allCollections = [
    new AcceptedTerm(),
    new Access(),
    new TravelerCopy(),
    new TravelerEmail(),
    new Traveler(),
    new TravelerReports()
  ]

  const collectionNames = allCollections.map(mock => mock.collection)
  console.log('The following collection are going to be deleted from firebase before tests are started')
  console.log(collectionNames)
  await Firestore.flushCollections(collectionNames)
  console.log('Collections are empty now and tests will start shortly...')
}

Cleanup()

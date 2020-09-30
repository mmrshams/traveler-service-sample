// Base model
// The models which want to connect to database and search engine should extend this model

// Firestore is used as default Database here. For Postgres you can add it like this:
//
// import { Postgres } from '@gokiteam/odm'
// const BaseModel = ({ ApplicationConfig: Config }) => {
//   return Postgres(Config)
// }

import { Firestore } from '@gokiteam/odm'

const BaseModel = ({ ApplicationConfig: Config }) => {
  return Firestore(Config)
}

export default BaseModel

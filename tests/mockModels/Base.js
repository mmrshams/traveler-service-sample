// Base class defines the interface for all MockObjects

const Firestore = require('../datastore/Firestore')
const Config = require('../configs/Application')

class Base {
  constructor ({ collection = null }) {
    if (!collection) throw Error('collection name must be provided')
    this.collection = `${Config.envShortName}_${collection}`
  }
  // This method puts the object's data on datastore
  async create () {
    this.firestore = new Firestore()
    await this.firestore.create([ this ])
  }

  // This will clean up the generated object from datastore
  async cleanup () {
    await this.firestore.cleanup()
  }

  get id () {
    if (!this.data.id) {
      throw Error('mock model is missing "id" within data field')
    }
    return this.data.id
  }
}

module.exports = Base

const Client = require('@google-cloud/firestore').Firestore
const configs = require('../configs/Application')

const client = new Client(configs.firestore)

class Firestore {
  constructor (collection) {
    this.stack = []
  }

  create = async (items) => {
    try {
      await client.runTransaction(async (transaction) => {
        for (let item of items) {
          let document = await client.collection(item.collection).doc(item.id)
          this.stack.push(document)
          transaction.create(document, item.data)
        }
      })
    } catch (e) {
      console.log('transaction error', e)
    }
  }

  cleanup = async (key, obj) => {
    try {
      let batch = client.batch()
      this.stack.forEach(async (document) => {
        batch.delete(document)
      })
      await batch.commit()
    } catch (e) {
      console.log('remove transaction failed', e)
    }
  }

  static flushCollections = async (collections) => {
    try {
      await client.runTransaction(async (transaction) => {
        for (const collection of collections) {
          let documents = await client.collection(collection).listDocuments()
          for (const document of documents) {
            transaction.delete(document)
          }
        }
      })
    } catch (e) {
      console.log('transaction error', e)
    }
  }

  static getAllByModel = async (models) => {
    let modelsData = []
    if (!Array.isArray(models)) {
      models = [models]
    }
    try {
      await client.runTransaction(async (transaction) => {
        const documents = models.map(model => {
          return client.collection(model.collection).doc(model.id)
        })
        const snapshots = await transaction.getAll(...documents)
        modelsData = snapshots.map(snapshot => {
          return snapshot.data()
        })
      })

      return modelsData
    } catch (e) {
      console.log('transaction error', e)
    }
  }

  static getByModel = async (model) => {
    try {
      const document = client.collection(model.collection).doc(model.id)
      const snapshot = await document.get(document)
      return snapshot.data()
    } catch (e) {
      console.log('transaction error', e)
    }
  }

  static getAllByCustomQuery = async (queries) => {
    let modelsData = []
    if (!Array.isArray(queries)) {
      queries = [queries]
    }
    try {
      const snapshots = []
      for (const query of queries) {
        const snapshot = await query(client)
        if (!snapshot.empty) {
          snapshots.push(snapshot.docs[0])
        }
      }
      modelsData = snapshots.map(snapshot => {
        return snapshot.data()
      })
      return modelsData
    } catch (e) {
      console.log('transaction error', e)
    }
  }

  static getByCustomQuery = async (query) => {
    let modelsData = null
    try {
      const snapshot = await query(client)
      if (!snapshot.empty) {
        modelsData = snapshot.docs[0].data()
      }
      return modelsData
    } catch (e) {
      console.log('transaction error', e)
    }
  }
}

module.exports = Firestore

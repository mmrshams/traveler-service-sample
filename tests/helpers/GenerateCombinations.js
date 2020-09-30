const privates = {
  generateMissingObjectsWithMissingFields: (fields) => {
    const combinations = []
    const keys = Object.keys(fields)
    for (let idx in keys) {
      const filteredKeys = keys.filter(x => x !== keys[idx])
      const filteredObject = Object.assign(
        ...filteredKeys.map(x => {
          let tmp = {}
          tmp[x] = fields[x]
          return tmp
        })
      )
      combinations.push(filteredObject)
    }
    return combinations
  },
  generateMissingObjectsWithBadFields: (goodObject, badFields) => {
    const keys = Object.keys(badFields)
    for (const key of keys) {
      if (!(key in goodObject)) {
        throw Error(`${key} property cannot be found in source object`)
      }
    }
    const combinations = keys.map((key) => {
      return Object.assign({}, goodObject, Object.fromEntries([[key, badFields[key]]]))
    })
    return combinations
  }
}

const GenerateCombinations = (primaryObject, secondaryObject) => {
  if (!secondaryObject) {
    return privates.generateMissingObjectsWithMissingFields(primaryObject)
  } else {
    return privates.generateMissingObjectsWithBadFields(primaryObject, secondaryObject)
  }
}

module.exports = GenerateCombinations

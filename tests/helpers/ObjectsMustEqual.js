const chai = require('chai')
const Filter = require('./Filter')

const { expect } = chai

const privates = {
  twoObjectsMustBeEqual: (keys, source, target) => {
    const sourceKeys = Object.keys(source)
    const targetKeys = Object.keys(target)
    expect(sourceKeys).to.include.members(keys)
    expect(targetKeys).to.include.members(keys)
    keys.forEach((key) => {
      expect(source[key]).to.deep.equal(target[key])
    })
  },
  twoArrayOfObjectsMustBeEqual: (keys, source, target, pivot) => {
    expect(source).to.have.lengthOf(target.length)
    for (const sourceObject of source) {
      const keyValue = sourceObject[pivot]
      const targetObject = target.find((obj) => obj[pivot] === keyValue)
      const filteredSource = Filter({ keys: keys, object: sourceObject })
      const filteredTarget = Filter({ keys: keys, object: targetObject })
      expect(filteredSource).to.deep.equal(filteredTarget)
    }
  },
  arrayMustIncludeObject: (keys, array, target, pivot) => {
    const source = array.find((item) => item[pivot] === target[pivot])
    if (!source) {
      throw Error('cannot find object in array')
    }
    const filteredSource = Filter({ keys: keys, object: source })
    const filteredTarget = Filter({ keys: keys, object: target })
    expect(filteredSource).to.deep.equal(filteredTarget)
  }
}

const ObjectsMustEqual = ({ keys = [], source = {}, target = {}, pivot = null } = {}) => {
  if (Array.isArray(source) && Array.isArray(target)) {
    if (!pivot) {
      throw Error('when comparing two arrays of objects you must define a pivot key to be used to pair objects')
    }
    return privates.twoArrayOfObjectsMustBeEqual(keys, source, target, pivot)
  } else if (Array.isArray(source) && !Array.isArray(target)) {
    if (!pivot) {
      throw Error(
        'when comparing an arrays of objects with an object you must define a pivot key to be used to pair objects')
    }
    return privates.arrayMustIncludeObject(keys, source, target, pivot)
  } else if (!Array.isArray(source) && !Array.isArray(target)) {
    return privates.twoObjectsMustBeEqual(keys, source, target)
  }

  throw Error('both source object must be either objects or array of objects')
}

module.exports = ObjectsMustEqual

const chai = require('chai')

const { expect } = chai

const MustHaveValue = async (keys, object) => {
  for (const key of keys) {
    expect(object[key]).to.not.be.oneOf([null, undefined])
  }
}

module.exports = MustHaveValue

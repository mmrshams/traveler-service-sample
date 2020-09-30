const chai = require('chai')

const { expect } = chai

const ModelsMustNotPersist = async (models) => {
  for (const model of models) {
    expect(model).to.be.oneOf([null, undefined])
  }
}

module.exports = ModelsMustNotPersist

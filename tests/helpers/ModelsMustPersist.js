const chai = require('chai')

const { expect } = chai

const ModelsMustPersist = async (models) => {
  expect(models).to.not.be.oneOf([null, undefined])
  for (const model of models) {
    expect(model).to.not.be.oneOf([null, undefined])
  }
}

module.exports = ModelsMustPersist

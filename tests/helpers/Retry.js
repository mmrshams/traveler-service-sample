const Sleep = require('./Sleep')
const defaultBackOffRatio = 3000
const defaultMaximumRetries = 5

const Retry = async (
  testFunction,
  maximumRetries = defaultMaximumRetries,
  backOffRatio = defaultBackOffRatio) => {
  for (let count = 0; count < maximumRetries; count++) {
    await Sleep(backOffRatio * count)
    const result = await testFunction()
    if (result !== false) {
      return true
    }
  }
  throw Error(`unfortunately after trying for ${maximumRetries} times the test could not pass`)
}

module.exports = Retry

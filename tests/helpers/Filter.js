const Filter = ({ keys = [], object = {}, exclude = false } = {}) => {
  const result = {}
  if (exclude) {
    const allKeys = Object.keys(object)
    const excludedKeys = keys
    keys = allKeys.filter(key => !excludedKeys.includes(key))
  }
  keys.forEach((key) => {
    result[key] = object[key]
  })

  return result
}

module.exports = Filter

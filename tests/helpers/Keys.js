const Keys = ({ object = null, keys = [], exclude = false } = {}) => {
  if (!object) throw Error('object is invalid')
  const allKeys = Object.keys(object)
  if (keys.length < 1) keys = allKeys
  if (exclude) {
    return allKeys.filter(key => !keys.includes(key))
  }
  return allKeys.filter(key => keys.includes(key))
}

module.exports = Keys

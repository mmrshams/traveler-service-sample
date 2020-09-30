const Repeat = (count, fn, params) => {
  return [...Array(count).keys()].map(key => params ? fn(params[key]) : fn())
}

module.exports = Repeat

// This is a middleware which converts files to streams.
// Also adds `koaAddedFields` to them to be able to validate them by content type.
// The original files will be available in `ctx.request.files`.

import _ from 'lodash'
import fs from 'fs'

const privates = {
  createStreamAndAddMeta (file) {
    if (_.isArray(file)) {
      let streams = []
      file.forEach(item => {
        streams.push(privates.converFileToStream(item))
      })
      return streams
    }
    return privates.converFileToStream(file)
  },
  converFileToStream (file) {
    let streamObj = fs.createReadStream(file.path)
    streamObj.koaAddedFields = {}
    streamObj.koaAddedFields.filename = file.name
    streamObj.koaAddedFields.contentType = file.type
    return streamObj
  }
}

const FileToStream = () => async (ctx, next) => {
  if (ctx.request.files) {
    let streamFiles = {}
    Object.keys(ctx.request.files).forEach(key => {
      streamFiles[key] = privates.createStreamAndAddMeta(ctx.request.files[key])
    })
    _.merge(ctx.request.body, streamFiles)
  }
  await next()
}

export default FileToStream

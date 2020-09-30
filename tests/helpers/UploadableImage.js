const Fs = require('fs')
const Os = require('os')
const Path = require('path')
const Https = require('https')
const Stream = require('stream').Transform

const privates = {
  asyncHttpGet: (url) => {
    return new Promise((resolve, reject) => {
      Https.get(url, response => {
        let responseBody = new Stream()
        response.on('data', (chunk) => {
          responseBody.push(chunk)
        })
        response.on('error', (err) => {
          reject(err)
        })
        response.on('end', () => {
          resolve(responseBody.read())
        })
      })
    })
  }
}

const UploadableImage = async (fakeImageUrl) => {
  const imageFilePath = Path.join(Os.tmpdir(), 'img.jpg')
  const response = await privates.asyncHttpGet(fakeImageUrl)
  Fs.writeFileSync(imageFilePath, response)
  return imageFilePath
}

module.exports = UploadableImage

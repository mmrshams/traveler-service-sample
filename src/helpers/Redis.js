// This module includes all methods related to redis.

import Promise from 'bluebird'
import Redis from 'redis'
import Redlock from 'redlock'

Promise.promisifyAll(Redis.RedisClient.prototype)
Promise.promisifyAll(Redis.Multi.prototype)

module.exports = ({ ApplicationConfig: Config, DefaultConfig: Default, LoggerHelper: Logger }) => {
  const redisClient = Redis.createClient(Config.cache.port, Config.cache.host)

  redisClient.on('error', (error) => {
    Logger.error(`There is an issue with cache server: ${error}`)
  })

  redisClient.on('connect', () => {
    Logger.info(`Cache server is running at ${Config.cache.host}:${Config.cache.port}`)
  })

  const redlock = new Redlock([redisClient], Default.redLock)

  return {
    isConnected () {
      return redisClient.connected
    },
    async get (key) {
      const result = await redisClient.getAsync(key)
      return result
    },
    async set (key, value, ttl = null) {
      if (ttl) return redisClient.multi().set(key, value, 'EX', ttl).execAsync()
      return redisClient.multi().set(key, value).execAsync()
    },
    async del (key) {
      return redisClient.delAsync(key)
    },
    async lock (resource, ttl = 60000) {
      return redlock.lock(resource, ttl)
    }
  }
}

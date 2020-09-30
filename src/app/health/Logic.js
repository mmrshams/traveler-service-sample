import Promise from 'bluebird'
import _ from 'lodash'
import { Oops } from '@gokiteam/oops'
import { readdirSync } from 'fs'
import Path from 'path'

const Logic = (opts) => {
  const {
    ApplicationConfig: Config,
    PubSubManagerHelper,
    ErrorLoggerHelper
  } = opts
  const privateMethods = {
    getConfigNames () {
      const files = readdirSync(Path.join(`${__dirname}`, '..', '..', 'configs'))
      let configNames = []
      files.forEach(filename => {
        const [name, ext] = filename.split('.')
        if (ext === 'js') {
          configNames.push(`${name}Config`)
        }
      })
      return configNames
    },
    async checkTopicsExistence () {
      if (!Config.pubSub.topics) return { allExist: true, faultyTopics: [] }
      let topicNames = Object.values(Config.pubSub.topics)
      if (Config.pubSub.subscribers) {
        Object.values(Config.pubSub.subscribers).forEach(item => {
          if (item.topicName) topicNames.push(item.topicName)
          if (item.deadLetterTopicName) topicNames.push(item.deadLetterTopicName)
        })
      }
      const topics = await PubSubManagerHelper.checkTopicsExistence(_.compact(_.uniq(topicNames)))
      let allExist = true
      let faultyTopics = []
      for (let item of topics) {
        if (!item.exists) {
          allExist = false
          faultyTopics.push(item.topic)
          break
        }
      }
      return { allExist, topics, faultyTopics }
    },
    async checkSubscriptionsExistence () {
      if (!Config.pubSub.subscribers) return { allExist: true, faultySubscriptions: [] }
      const subscriptionNames = Object.values(Config.pubSub.subscribers).map(item => item.subscriptionName)
      const subscriptions = await PubSubManagerHelper.checkSubscriptionsExistence(_.compact(_.uniq(subscriptionNames)))
      let allExist = true
      let faultySubscriptions = []
      for (let item of subscriptions) {
        if (!item.exists) {
          allExist = false
          faultySubscriptions.push(item.subscription)
          break
        }
      }
      return { allExist, subscriptions, faultySubscriptions }
    },
    async checkEnvVariables () {
      const configNames = privateMethods.getConfigNames()
      const allConfigs = []
      const result = {}
      let allConfigsSet = true
      configNames.forEach(configName => {
        allConfigs.push({ configName, value: opts[configName] })
      })
      allConfigs.forEach(item => {
        const { allSet, faultyConfigs } = privateMethods.checkConfigsValidity({ configs: item.value })
        if (!allSet) allConfigsSet = false
        result[`faulty${item.configName}`] = faultyConfigs
        result[`${_.lowerFirst(item.configName)}Set`] = allSet
      })
      result.allConfigsSet = allConfigsSet
      return result
    },
    checkConfigsValidity ({ configs, parentKey = '', nestedLevel = 0 }) {
      const response = {
        allSet: true,
        faultyConfigs: []
      }
      if (nestedLevel > 10) {
        return response
      }
      const results = []
      Object.keys(configs).forEach(key => {
        if (!_.isPlainObject(configs[key])) {
          if (!privateMethods.isConfigValueValid(configs[key])) {
            results.push({ allSet: false, faultyConfigs: [`${parentKey}.${key}`.substring(1)] })
          }
        } else {
          results.push(privateMethods.checkConfigsValidity(
            { configs: configs[key], parentKey: `${parentKey}.${key}`, nestedLevel: nestedLevel + 1 }))
        }
      })
      results.forEach(({ allSet, faultyConfigs }) => {
        if (!allSet) response.allSet = false
        response.faultyConfigs = response.faultyConfigs.concat(faultyConfigs)
      })
      return response
    },
    isConfigValueValid (value) {
      return (typeof value !== 'undefined' && value !== null)
    }
  }
  const publicMethods = {
    async checkReadiness () {
      const [
        { allExist: allTopicsExist, faultyTopics },
        { allExist: allSubscriptionsExist, faultySubscriptions },
        configsCheckResult
      ] =
      await Promise.all([
        privateMethods.checkTopicsExistence(),
        privateMethods.checkSubscriptionsExistence(),
        privateMethods.checkEnvVariables()
      ])
      const result = {
        ready: (allTopicsExist && allSubscriptionsExist && configsCheckResult.allConfigsSet),
        allTopicsExist,
        allSubscriptionsExist,
        faultyTopics,
        faultySubscriptions,
        ...configsCheckResult
      }
      if (!result.ready) {
        publicMethods.logReadinessFailed({ data: { ...result, allTopicsExist, allSubscriptionsExist } })
      }
      return result
    },
    logReadinessFailed ({ error = null, data = {} }) {
      if (!error) error = Oops.internal('Readiness failed')
      data.event = 'readinessFailed'
      ErrorLoggerHelper.log(error, null, data)
    }
  }
  return publicMethods
}

export default Logic

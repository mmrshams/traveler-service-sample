// This module creates an [awilix](https://github.com/jeffijoe/awilix) dependency container

import pluralize from 'pluralize'
import {
  createContainer, InjectionMode,
  Lifetime, asFunction
} from 'awilix'

// The injection names are based on the location of the files following below rules:
// * **app/ folder** all files are accessible by file name + singular format of parent folder name
// * **Other folders (e.g. models/ middleware/ helpers/)** all files are accessible
// by file name + singular format of parent folder name
// * **No folder** all files are accessible by file name

const specifyDependencyName = (name, descriptor) => {
  const splat = descriptor.path.split('/')
  const namespace = splat[splat.length - 2]
  const root = __dirname.split('/').pop()
  const parts = [name]
  if (root !== namespace) {
    if (descriptor.path.includes(`${root}/app`)) {
      parts.unshift(namespace)
    } else if (descriptor.path.includes(`${root}/endpoints`)) parts.push(namespace)
    else {
      parts.push(pluralize.singular(namespace))
    }
  }
  parts.forEach((item, index) => {
    parts[index] = `${item.charAt(0).toUpperCase()}${item.slice(1)}`
  })
  return parts.join('')
}

// Common modules are defined as SINGLETON because they are shared modules.
// But APP modules are defined TRANSIENT because they are not shared.
// And DI container creates an instance of an APP module only when required.

const makeContainer = () => {
  const container = createContainer({
    injectionMode: InjectionMode.PROXY
  })

  container.loadModules([
    `${__dirname}/configs/*.js`,
    `${__dirname}/helpers/*.js`,
    `${__dirname}/middleware/*.js`,
    `${__dirname}/Routes.js`,
    `${__dirname}/PubSubSubscriberWithRedis.js`,
    `${__dirname}/PubSubSubscribers.js`,
    `${__dirname}/Odm.js`,
    `${__dirname}/models/*.js`,
    `${__dirname}/logic/*.js`,
    `${__dirname}/pubSubSubscribers/*.js`,
    `${__dirname}/enums/*.js`,
    [
      `${__dirname}/endpoints/*.js`,
      {
        lifetime: Lifetime.TRANSIENT
      }
    ],
    [
      `${__dirname}/app/**/*.js`,
      {
        lifetime: Lifetime.TRANSIENT
      }
    ]
  ], {
    formatName: specifyDependencyName,
    resolverOptions: {
      register: asFunction,
      lifetime: Lifetime.SINGLETON
    }
  })
  return container
}

export default makeContainer

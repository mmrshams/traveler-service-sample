import { lstatSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'
import CombineRouters from 'koa-combine-routers'

// Loading routers automatically from App folder/subfolders.

const privates = {
  isDirectory: source => lstatSync(source).isDirectory(),
  getDirectories: source => (
    readdirSync(source).map(name => join(source, name)).filter(privates.isDirectory)
  ),
  getRouteNames: () => {
    const resources = privates.getDirectories(`${__dirname}/app`)
    const routeNames = []
    resources.forEach((resource) => {
      if (existsSync(`${resource}/Routes.js`)) {
        const splat = resource.split('/')
        const namespace = splat[splat.length - 1]
        routeNames.push(`${`${namespace.charAt(0).toUpperCase()}${namespace.slice(1)}`}Routes`)
      }
    })
    return routeNames
  }
}

const Routes = (opts) => {
  const routeNames = privates.getRouteNames()
  const routes = routeNames.map(routeName => opts[routeName])
  const middleware = CombineRouters(routes)
  middleware.routeList = routes
  return middleware
}

export default Routes

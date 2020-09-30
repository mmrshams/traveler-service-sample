import Koa from 'koa'
import koaBody from 'koa-body'
import KoaAPIDocs from 'koa-api-docs'

// This is where we create all dependencies
import makeContainer from './DependencyInjector'

const {
  ApplicationConfig: Config,
  LoggerHelper: Logger,
  Routes,
  HttpLoggerMiddleware,
  ReplyMiddleware,
  QueryParserMiddleware,
  FileToStreamMiddleware,
  PubSubSubscribers,
  MaskMiddleware,
  ErrorCatcherMiddleware
} = makeContainer().cradle

PubSubSubscribers.load()

// Create Koa Server, register middleware and start
const app = new Koa()
app.use(QueryParserMiddleware)
app.use(koaBody({ multipart: true, parsedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'] }))
app.use(HttpLoggerMiddleware)
app.use(FileToStreamMiddleware)
app.use(MaskMiddleware)
app.use(KoaAPIDocs(Routes.routeList))
app.use(ReplyMiddleware)
app.use(ErrorCatcherMiddleware)
app.use(Routes())

const port = (Config.server && Config.server.port) ? Config.server.port : 3000
app.listen(port)
Logger.info(`Server is listening at port ${port}!`)

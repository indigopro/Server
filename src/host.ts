import express from 'express'
import { Settings } from './settings'
import { DataConnectionSettings, DataContext, ServiceCollection, Service } from './services'
import { api } from './api'
import { Activator } from './reflector'
import cors from 'cors'

export const environment = process.env.NODE_ENV || 'development'
export const debug = environment === 'test' || process.env.DEBUG === 'true'

export class Host {
  readonly settings: Settings | any
  readonly services: ServiceCollection

  constructor(settings: Settings | any) {
    global.host = this
    this.settings = settings
    this.services = new ServiceCollection()
  }

  useDataBaseContext(...args:
    [dataConnection: DataConnectionSettings] |
    [dataContext: DataContext] |
    [key: string, dataConnection: DataConnectionSettings] |
    [key: string, dataContext: DataContext]): void {

    let key = ((args[0]?.constructor.name === 'String') ? args[0] : undefined) as string;
    let dataContext = (key ? ((args[1] instanceof DataContext) ? args[1] : undefined) : ((args[0] instanceof DataContext) ? args[0] : undefined)) as DataContext

    if (!dataContext)
      dataContext = new DataContext((key ? args[1] : args[0]) as DataConnectionSettings)

    this.services.addService(key, dataContext)
  }

  useService(...args:
    [serviceType: object] |
    [serviceTypeCollection: Array<object>]): void {

    let serviceTypeCollection = Array.isArray(args[0]) ? args[0] : [args[0]]

    serviceTypeCollection.flatMap(o => o).forEach(serviceType => {
      const service = Activator.CreateInstance<Service>(serviceType, null)
      this.services.addService(service.constructor.name, service)
    })
  }

  useAuthorize(serviceType: object, args?: any): void {
    const service = Activator.CreateInstance<Service>(serviceType, args)
    this.services.addService('AuthorizeService', service)
  }

  run() {
    const context: { [key: string]: any } = express()
    context.use(express.json({ limit: this.settings.server.maxRequestBodySize }))
    context.use(express.urlencoded({ limit: this.settings.server.maxRequestBodySize, extended: true })) // for parsing application/x-www-form-urlencoded
    context.use(cors({ origin: '*' }))
    context.use(api())

    context.listen(process.env.PORT || this.settings.server.port || 4000, (err?: any) => {
      err && console.error({ err })
      console.debug('server:', { running: true, port: this.settings.server.port })
    })
  }
}

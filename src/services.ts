
import MSSQL from 'mssql'
import { Settings, DataConnection } from './settings';
import { virtualFolder } from './repository';

//#region 

export enum ServiceTypes {
  DataContext,
  DataService,
  AuthorizeService
}

export class Service {
  readonly type: ServiceTypes

  constructor(type: ServiceTypes) {
    this.type = type
  }
}

//#endregion

//#region ServiceCollection

export class ServiceCollection {
  readonly entries: { [key: string]: Service }

  constructor() {
    this.entries = {}
  }

  getService<TService>(key: string): TService {
    const service = this.entries[key]

    if (service)
      return service as TService

    throw new Error(`Unable to ${key} service`);
  }

  getServices(typeOf: ServiceTypes): { [key: string]: Service } {
    return Object.entries(this.entries).reduce((collection: { [key: string]: Service }, [key, service]) => {
      if (service.type === typeOf)
        collection[key] = service
      return collection
    }, {}) as { [key: string]: Service }
  }

  addService(key: string | undefined, service: Service): void {
    key = key || service.constructor.name
    this.entries[key] = service
  }
}

//#endregion

//#region DataContext

export type DataResult = {
  status: number
  data: Array<any> | any | null
  error: boolean
  message: string
}

export class DataContext extends Service {
  connectionPool: MSSQL.ConnectionPool

  constructor(dataConnection: DataConnection) {
    super(ServiceTypes.DataContext)
    this.connectionPool = new MSSQL.ConnectionPool(
      {
        ...dataConnection,
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000,
        },
        options: {
          encrypt: true,
          trustServerCertificate: true,
          camelCaseColumns: true,
          useUTC: true,
        },
        parseJSON: true,
      }
    )
  }

  getData = (query: string) => new Promise<any>((resolve, reject) => {
    this.connectionPool.connect()
      .then((connectionPool) => {
        connectionPool.query(query)
          .then((result) => {
            console.debug('command:', { dbase: (connectionPool as any).config.database, query })
            resolve(result.recordsets.length === 1 ? result.recordset : result.recordsets)
          })
          .catch((err) => reject(err))
      }).catch((err) => reject(err))
  })
}

//#endregion

//#region DataService

export abstract class DataService extends Service {
  readonly name: string;
  readonly settings: Settings;
  readonly dataContext: DataContext;
  readonly services: ServiceCollection;
  readonly folder: string;

  constructor(dataContext: string | undefined) {
    super(ServiceTypes.DataService)
    this.name = `${this.constructor.name.substring(0, this.constructor.name.includes('V') ? this.constructor.name.lastIndexOf('V') : this.constructor.length)}`;
    this.settings = host.settings;
    this.dataContext = host.services.getService<DataContext>(dataContext || 'DataContext')
    this.services = host.services;
    this.folder = `${virtualFolder('assets').physicalPath}/${this.name}`;
  }

  getData = (query: string) => this.dataContext.getData(query);
}

//#endregion

export type UserIdentity = {
  id: number
  name: string
  uniqueIdentifier: string
}

export abstract class AuthorizeService extends Service {
  readonly settings: Settings;
  readonly dataContext: DataContext;

  constructor(dataContext: string | undefined) {
    super(ServiceTypes.DataService)
    this.settings = host.settings;
    this.dataContext = host.services.getService<DataContext>(dataContext || 'DataContext')
  }

  abstract authorize(uniqueIdentifier: string): Promise<UserIdentity>

  getData = (query: string) => this.dataContext.getData(query);
}
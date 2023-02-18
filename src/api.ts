
import 'reflect-metadata'
import { NextFunction } from 'express'
import type { Authorization } from '@indigopro/core'
import { AsymmetricCryptor } from './cryptor'
import { AuthorizeService, DataService, ServiceTypes, UserIdentity } from './services'
import { debug, Host } from './host'
import moment from 'moment'

export type Args = any & {
  context?: {
    domain: string, // Domain
    user: any, // User,
    authentication: any, // { authorization, authorized },
    request: any,
    response: any
  }
}

type Endpoint = {
  authorization: Authorization
  verb: 'GET' | 'POST'
  route: string
  service: string
  method: string
}

const defineEndpoint = (verb: 'GET' | 'POST', authorization: Authorization = 'Authorize', route: string | null = null) => {
  return (target: Object, key: string, descriptor: PropertyDescriptor) => {
    route = route ? (route.charAt(1) === '/' ? route.substring(1) : route) : key
    const version = target.constructor.name.substring(target.constructor.name.lastIndexOf('V'))

    const endpoint: Endpoint = {
      authorization: authorization,
      verb,
      route: `/${target.constructor.name.replace(version, '')}/${version.toLowerCase()}/${route}`,
      service: target.constructor.name,
      method: key,
    }

    const endpoints = Reflect.getMetadata('endpoints', target) || []
    endpoints.push(endpoint)
    Reflect.defineMetadata('endpoints', endpoints, target)
  }
}

export const post = (authorization: Authorization = 'Authorize', route: string | null = null) => defineEndpoint('POST', authorization, route)

export const get = (authorization: Authorization = 'Authorize', route: string | null = null) => defineEndpoint('GET', authorization, route)

export const api = (options?: any): (req: any, res: any, next: NextFunction) => void => {
  const host: Host = global.host
  const dataServices = host.services.getServices(ServiceTypes.DataService)

  // enpoints extraction 
  const endpoints: Array<Endpoint> = []
  Object.values(dataServices).forEach((dataService: any) => {
    let target = Object.getPrototypeOf(dataService)
    while (target != Object.prototype) {
      let children = Reflect.getOwnMetadata('endpoints', target) || []
      endpoints.push(...children)
      target = Object.getPrototypeOf(target)
    }
  })

  // debug enpoints info
  console.debug('-------------------------------------------------------------------------------------------------')
  endpoints.forEach(endpoint => console.debug(`%c${endpoint.authorization === 'AllowAnonymous' ? 'AllowAnonymous  ' : '\t\t'} %c${endpoint.verb.padStart(4, ' ')}: %c${endpoint.route}`, endpoint.verb === 'POST' ? 'color:#0066CC' : 'color:yellow;', 'color:gray;', 'color:white;background:red;'))
  console.debug('-------------------------------------------------------------------------------------------------')

  const authenticate = async (type: Authorization, authorization: string): Promise<{ authorized: boolean; user: any }> => {
    const startPerformance = performance.now();
    let user: UserIdentity | undefined = undefined
    let authorized: boolean = false

    console.debug('-------------------------------------------------------------------------------------------------')
    console.debug('authentication:', {type})

    switch (type) {
      case 'AllowAnonymous':
        authorized = true
        break
      case 'Authorize':
        if (authorization && authorization.startsWith('Bearer')) {
          try {
            // token parse
            const token: string = authorization.split(' ')[1]
            let authenticationInfo: { [key: string]: string } = {}
            const tokenChunks = token.split(';')
            tokenChunks.forEach((tokenChunk) => {
              const keyValuePair = JSON.parse(AsymmetricCryptor.decrypt(tokenChunk, global.host.settings.asymmetricEncryption['default'].privateKey))
              authenticationInfo = { ...authenticationInfo, ...keyValuePair }
            })

            // token expiration check
            const tokenTimeStamp = moment(new Date(authenticationInfo.timeStamp))
            const now = moment()
            const deltaMilliseconds = now.diff(tokenTimeStamp)
            const maxDelta = global.host.settings.authenticationToken?.expiresIn || 3600
            if (deltaMilliseconds < maxDelta) {
              authorized = true
            } else {
              authorized = false
              console.debug({ error: 'Authenticate Token expired' })
              break
            }

            // authentication user check            
            const host: Host = global.host
            const authorizeDataService = host.services.getService<AuthorizeService>('AuthorizeService')
            console.debug('authorize:', { uniqueIdentifier: authenticationInfo.uniqueIdentifier })
            user = await authorizeDataService.authorize(authenticationInfo.uniqueIdentifier)
            const authenticated = user?.uniqueIdentifier === authenticationInfo.uniqueIdentifier
            if (authenticated) {
              authorized = true
            } else {
              authorized = false
              console.debug({ error: 'User authentication failed' })
              break
            }
          } catch (err: any) {
            authorized = false
            console.debug({ authenticate: { error: err.message || err } })
          }
        }
    }

    
    const endPerformance = performance.now();
    console.debug('total performance:', { time: endPerformance - startPerformance }, 'milliseconds.');
    return { authorized, user }
  }

  const hook = async (request: any, response: any, next: NextFunction) => {
    const startPerformance = performance.now();
    const endpoint = endpoints.find(endpoint => endpoint.route.toLowerCase() === request.path.toLowerCase())

    if (endpoint && request.method === endpoint.verb) {
      const headers = request.headers
      const { service, method } = endpoint
      const { authorized, user } = await authenticate(endpoint.authorization, headers.authorization)

      let args: Args
      if (authorized) {
        try {
          const host: Host = global.host
          const dataService = host.services.getService<DataService>(service) as any

          const origin: string = headers.origin
          const domain: string = origin && new URL(origin).host

          args = { ...request.query, ...request.body, context: { domain, user, authentication: { authorization: endpoint.authorization, authorized }, request, response } }
          console.debug('-------------------------------------------------------------------------------------------------')
          console.debug('request:', { endpoint })
          console.debug('args:', { ...args, context: { ...args.context, request: '[...]', response: '[...]' } })
          const data = await dataService[method](args)
          response.status(200).json({ status: "OK", data })
        } catch (err: any) {
          response.status(200).json({
            status: "FAILED", data: {
              error: true,
              message:
                debug
                  ? { error: (err?.message || err), endpoint, args: args ? { ...args, context: { ...args.context, request: '[...]', response: '[...]' } } : undefined }
                  : 'Internal Server Error'
            }
          })
        }
      } else {
        response.status(401).json({ status: "FAILED", data: { error: true, message: 'Unauthorized' } })
      }

    } else {
      response.status(404).json({ status: "FAILED", data: { error: true, message: 'Not Found' } })
    }


    const endPerformance = performance.now();
    console.debug('total performance:', { time: endPerformance - startPerformance }, 'milliseconds.');
  }


  return hook
}

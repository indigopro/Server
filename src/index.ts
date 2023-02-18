

import { Host } from './host'

export { environment } from './host'
export { DataService, AuthorizeService, UserIdentity } from './services'
export * as repository from './repository'
export { post, get, Args } from './api'

export const Hello = (name: string) => `Hello ${name}`;

export default Host


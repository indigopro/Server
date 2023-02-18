export type Authorization = 'Authorize' | 'AllowAnonymous'

export type AuthorizationRequestArgs = {
  clientKey?: string
  grantType: 'Kerberos' | 'AuthorizationCode' | 'PKCE' | 'ClientCredentials' | 'DeviceCode' | 'RefreshToken'
  email?: string
  password?: string
  scope?: string
  redirectUri?: string
}

export type AuthorizationToken = {
  accessToken?: string
  tokenType: 'Bearer'
  expiresIn?: number
  refreshToken?: string
  scope?: string
}

export interface AuthenticationDataService {
  getAccessToken(): Promise<AuthorizationToken>
}

export type AuthenticationState = {
  type: Authorization
  authorized: boolean
}
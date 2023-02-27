import crypto from 'crypto'

export type AsymmetricCryptorSettings = {
  [key: string]: {
  privateKey: string
  publicKey: string
}
}

export namespace AsymmetricCryptor {
  export const DefaultSettings = {
    privateKey:'',
     publicKey: ''
   }

  export const decrypt = (dataBase64: string, privateKey: string): string => {
    const key = `-----BEGIN RSA PRIVATE KEY-----\n${privateKey}\n-----END RSA PRIVATE KEY-----`
    const buffer = crypto.privateDecrypt({ key }, Buffer.from(dataBase64, 'base64'))
    return buffer.toString('utf8')
  }

  export const encrypt = (data: any, publicKey: string): string => {
    const key = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`
    const buffer = crypto.publicEncrypt(key, Buffer.from(data))
    return buffer.toString('base64')
  }
}


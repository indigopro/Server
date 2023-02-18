import crypto from 'crypto'
 import CryptoJS from 'crypto-js'

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

//-------------------Symmetric-------------------
export type SymmetricCryptorSettings = {
  [key: string]: {
    key: string
    iv: string
  }
}
//NOTE: sostituire CryptoJS con crypto nel tempo
export namespace SymmetricCryptor {
  const key = CryptoJS.enc.Utf8.parse('')
  const iv = CryptoJS.enc.Utf8.parse('')

  export const encrypt = (data: string, keyString: string, ivString: string): string => {
     const key = CryptoJS.enc.Utf8.parse(keyString)
     const iv =  CryptoJS.enc.Utf8.parse(ivString)

    const result = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(data), key , {
      keySize: 128 / 8,
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    })

    return result.toString()
  }

  export const decrypt = (encrypted: string, keyString: string, ivString: string): string => {
     const key = CryptoJS.enc.Utf8.parse(keyString)
     const iv =  CryptoJS.enc.Utf8.parse(ivString)

    const result = CryptoJS.AES.decrypt(encrypted, key , {
      keySize: 128 / 8,
      iv: iv ,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    })

    return result.toString(CryptoJS.enc.Utf8)
  }
}

import "reflect-metadata"


// import path from 'path'
// import glob from 'glob'

// export const multipleImport = (folder: string, match: string) =>
//   new Promise<Array<any>>((resolve, reject) => {
//     glob(path.join(__dirname, `${folder}/${match}`), (err: Error | null, matches: string[]) => {
//       if (err) {
//         reject(err)
//       } else {
//         Promise.all(
//           matches.map((file) => {
//             return import(file)
//           })
//         ).then((modules) => {
//           resolve(modules)
//         })
//       }
//     })
//   })

export namespace Activator {
  export const CreateInstance = <T>(descriptor: any, args:any): T => {
    const instance = new (descriptor as FunctionConstructor)(args)
    return instance as T
  }
}

export const setMetaData = (metadataKey: string, target: any, key: string, descriptor: PropertyDescriptor) => {
  const entries = Reflect.getMetadata(metadataKey, target) || []
  entries.push(key)
  Reflect.defineMetadata(metadataKey, entries, target)
}

export const getMetaData = (metadataKey: any, target: Object): Array<any> => {
  let entries = []
  target = Object.getPrototypeOf(target)
  while (target != Object.prototype) {
    let children = Reflect.getOwnMetadata(metadataKey, target) || []
    entries.push(...children)
    target = Object.getPrototypeOf(target)
  }

  return entries
}

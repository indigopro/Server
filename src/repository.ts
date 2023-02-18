import mime from 'mime'
import fs, { promises as Fs } from 'fs'

export type VirtualFolders = { [key: string]: { physicalPath: string } }

export type DocumentEntry = {
  type: 'Document'
  name: string
  path?: string
  physicalPath?: string | null
  extension: string
  mimeType: string | null
  lastModifiedDate?: any
  size?: number
  url?: string | null
  base64Stream?: string | null
}

export type FolderEntry = {
  type: 'Folder'
  name: string
  path: string
  physicalPath?: string | null
  entries?: Array<FolderEntry | DocumentEntry>
}

export const virtualFolder = (path: string): { physicalPath: string } => {
  return { physicalPath: global.host.settings.virtualFolders[path].physicalPath }
}

export const getDocumentExtension = (name: string) => {
  const re: any = /(?:\.([^.]+))?$/
  const ext = re.exec(name)[1]
  return ext ? ext : ''
}

export const getDocumentName = (path: string) => path.substring(path.replaceAll('\\', '/').lastIndexOf('/') + 1)

export const getStream = (path: string) =>
  new Promise<string | null>((resolve, reject) => {
    const fileMime = mime.getType(path)
    Fs.readFile(path)
      .then((buffer) => {
        resolve(`data:${fileMime};base64,${buffer.toString('base64')}`)
      })
      .catch((err) => {
        console.error(err.message)
        resolve(null)
      })
  })

export const saveDocument = (path: string, name: string, dataBase64: string) =>
  new Promise<boolean>((resolve, reject) => {
    //const fileMime = mime.getType(path);

    //if already existing, the folder won't be created again, not a copy of it or a replacement
    Fs.mkdir(path, { recursive: true })
      .then((resultCreateFolder) => {
        Fs.writeFile(path + '/' + name, dataBase64.split(';base64,')[1], 'base64')
          .then(() => {
            resolve(true)
          })
          .catch((err) => {
            console.error(err.message)
            reject(err)
          })
      })
      .catch((err) => {
        console.error(err.message)
        reject(err)
      })
  })

export const deleteDocument = (path: string) =>
  new Promise<boolean>((resolve, reject) => {
    Fs.unlink(path)
      .then(() => resolve(true))
      .catch((err) => {
        console.error(err.message)
        reject(err)
      })
  })

export const documentExists = (path: string) =>
  new Promise<boolean>((resolve) => {
    Fs.access(path, fs.constants.F_OK)
      .then((data) => {
        resolve(true)
      })
      .catch((err) => {
        console.error(err.message)
        resolve(false)
      })
  })

export const getDocument = (path: string, includeStream: boolean = false, includeSubFolder: boolean = false, relativePath: string = '') =>
  new Promise<DocumentEntry>(async (resolve) =>
    resolve({
      type: 'Document',
      name: getDocumentName(path),
      extension: getDocumentExtension(path),
      mimeType: mime.getType(path),
      base64Stream: await getStream(path),
    })
  )

export const getDocuments = (folderPath: string, includeStream: boolean = false, includeSubFolder: boolean = false, includePhysicalPath: boolean, relativePath: string = '') =>
  new Promise<Array<FolderEntry | DocumentEntry>>(async (resolve) => {
    const physicalPathFolder = folderPath
    const entriesInfo: Array<FolderEntry | DocumentEntry> = []
    console.log('getDocuments', includePhysicalPath, physicalPathFolder)
    try {
      const entries = await Fs.readdir(physicalPathFolder)
      for (let i in entries) {
        var entryName = entries[i]
        const physicalPathEntry = physicalPathFolder + '/' + entryName
        const relativePathEntry = `${relativePath}/${entryName}`
        const isFolder = (await Fs.stat(physicalPathEntry)).isDirectory()
        const entry: FolderEntry | DocumentEntry = isFolder
          ? { type: 'Folder', name: entryName, path: relativePathEntry, physicalPath: includePhysicalPath ? physicalPathEntry : null, entries: await getDocuments(physicalPathEntry, includeStream, includeSubFolder, includePhysicalPath, relativePathEntry) }
          : {
            type: 'Document',
            name: entryName,
            path: relativePathEntry,
            physicalPath: includePhysicalPath ? physicalPathEntry : null,
            mimeType: mime.getType(physicalPathEntry),
            extension: getDocumentExtension(entryName),
            base64Stream: includeStream ? await getStream(physicalPathEntry) : null,
          }
        entriesInfo.push(entry)
      }
      resolve(entriesInfo)
    } catch (err) {
      resolve([])
    }
  })

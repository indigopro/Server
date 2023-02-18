import { AsymmetricCryptorSettings, SymmetricCryptorSettings } from './cryptor';
import { VirtualFolders } from './repository';


export type DataConnection = {
  user: string;
  password: string;
  server: string;
  database: string;
}

export type Settings = {
  server: {
    port: number;
    maxRequestBodySize: string;
  };
  baseUrl: string;
  portalUrl: string;
  authenticationToken: {
    expiresIn: number | string;
  };
  dataConnection: DataConnection;
  smtp?: SMTPSettings;
  smpp?: SMPPSettings;
  asymmetricEncryption: AsymmetricCryptorSettings;
  symmetricEncryption: SymmetricCryptorSettings;
  virtualFolders: VirtualFolders;
  logEnabled: boolean;
  api: {
    [key: string]: {
      url: string;
      auth: { token: string; };
    } |
    any;
  };
};

//#region SMTP

export type SMTPSettings = {
  enabled: boolean
  host: string
  port: number
  auth?: {
    user: string
    pass: string
  }
  noReplyEmail: string
  bccDefaultEmailAddress: string
  secure?: boolean
  ignoreTLS?: boolean
}


export type EmailParameters = {
  from?: string
  to?: string | Array<string>
  cc?: string | Array<string>
  bcc?: string | Array<string>
  subject?: string
  content?: string
  isHtml?: boolean
  attachments?: any[]
}

//#endregion

//#region 

export type SMPPSettings = {
  enabled: boolean
  endpointURL: string
  productToken: string
  allowedChannels: Array<string>
  sender: string
  bodyType?: 'auto'
}

export type SMSParameters = {
  message: string
  phoneNumber: string
}

//#endregion
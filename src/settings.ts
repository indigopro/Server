import { AsymmetricCryptorSettings } from './cryptor';
import { DataConnectionSettings, SMPPSettings, SMTPSettings } from './services';
import { VirtualFolders } from './repository';

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
  dataConnection: DataConnectionSettings;
  smtp?: SMTPSettings;
  smpp?: SMPPSettings;
  asymmetricEncryption: AsymmetricCryptorSettings;
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

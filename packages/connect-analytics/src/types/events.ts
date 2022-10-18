import { EventType } from '../constants';

export type ConnectAnalyticsEvent =
    | {
          type: EventType.AppReady;
          payload: {
              browserName: string;
              browserVersion: string;
              osName: string;
              osVersion: string;
              connectVersion: string;
              referrer: string;
              functionCall: string;
              network: string;
              screenWidth: number;
              screenHeight: number;
              windowWidth: number;
              windowHeight: number;
              platformLanguages: string;
          };
      }
    | {
          type: EventType.Transport;
          payload: {
              type: string;
              version: string;
          };
      }
    | {
          type: EventType.DeviceConnect | EventType.DeviceDisconnect;
          payload: {
              mode: 'normal' | 'bootloader' | 'initialize' | 'seedless';
              firmware: string;
              bootloader?: string;
              pinProtection?: boolean | null;
              passphraseProtection?: boolean | null;
              totalInstances?: number | null;
              backupType?: string;
              isBitcoinOnly?: boolean;
              totalDevices?: number;
              language?: string | null;
              model?: string;
              firmwareRevision?: string;
              bootloaderHash?: string;
          };
      }
    | {
          type: EventType.ViewChange;
          payload: {
              previous: string;
              next: string;
          };
      }
    | {
          type: EventType.SettingsTracking;
          payload: {
              value: boolean;
          };
      }
    | {
          type: EventType.SettingsPermissions;
          payload: {
              duration: 'lifetime' | 'session';
          };
      }
    | {
          type: EventType.WalletType;
          payload: {
              type: 'hidden' | 'standard';
          };
      };

import { EventType } from '../constants';

export type ConnectAnalyticsEvent =
    | {
          type: EventType.DeviceConnect;
      }
    | {
          type: EventType.DeviceDisconnect;
      }
    | {
          type: EventType.SettingsTracking;
          value: boolean;
      };

import produce from 'immer';
import { NOTIFICATION } from '@suite-actions/constants';
import { Action, TrezorDevice } from '@suite-types';
import { Network } from '@wallet-types';
import { UpdateState } from '@suite-reducers/desktopUpdateReducer';
import type { PROTOCOL_SCHEME } from '@suite-constants/protocol';
import type { TranslationKey } from '@suite-components/Translation/components/BaseTranslation';
import { NotificationEventPayload, NotificationOptions } from '@suite-common/notifications';

export type ToastPayload = (
    | {
          type: 'acquire-error';
          error: string;
          device?: TrezorDevice;
      }
    | {
          type: 'auth-confirm-error';
          error?: string;
      }
    | {
          type:
              | 'settings-applied'
              | 'pin-changed'
              | 'device-wiped'
              | 'backup-success'
              | 'backup-failed'
              | 'sign-message-success'
              | 'verify-message-success'
              | 'firmware-check-authenticity-success';
      }
    | {
          type: 'tx-sent';
          formattedAmount: string;
          device?: TrezorDevice;
          descriptor: string;
          symbol: Network['symbol'];
          txid: string;
      }
    | {
          type: 'raw-tx-sent';
          txid: string;
      }
    | {
          type: 'copy-to-clipboard';
      }
    | {
          type: 'clear-storage';
      }
    | {
          type: 'bridge-dev-restart';
          devMode: boolean;
      }
    | {
          type: 'add-token-success';
      }
    | {
          type:
              | 'error'
              | 'auth-failed'
              | 'discovery-error'
              | 'verify-address-error'
              | 'sign-message-error'
              | 'verify-message-error'
              | 'sign-tx-error'
              | 'metadata-auth-error'
              | 'metadata-not-found-error'
              | 'metadata-unexpected-error';
          error: string;
      }
    | {
          type: 'auto-updater-error';
          state: UpdateState;
      }
    | {
          type: 'auto-updater-no-new';
      }
    | {
          type: 'auto-updater-new-version-first-run';
          version: string;
      }
    | {
          type: 'user-feedback-send-success' | 'user-feedback-send-error';
      }
    | {
          type: 'qr-incorrect-coin-scheme-protocol';
          coin: string;
      }
    | {
          type: 'qr-incorrect-address';
      }
    | {
          type: 'coin-scheme-protocol';
          scheme: PROTOCOL_SCHEME;
          address: string;
          amount?: number;
      }
    | {
          type: 'cardano-delegate-error';
          error: string;
      }
    | {
          type: 'cardano-withdrawal-error';
          error: string;
      }
    | {
          type: 'savings-kyc-failed';
      }
    | {
          type: 'savings-kyc-success';
      }
    | {
          type: 'tor-toggle-error';
          error: TranslationKey;
      }
) &
    NotificationOptions;

interface Common {
    id: number; // programmer provided, might be used to find and close notification programmatically
    device?: TrezorDevice; // used to close notifications for device
    closed?: boolean;
    error?: string;
}

export type EventPayload = NotificationEventPayload;

export type ToastNotification = { context: 'toast' } & Common & ToastPayload;
export type EventNotification = { context: 'event' } & Common & EventPayload;

export type NotificationEntry = ToastNotification | EventNotification;

export type State = NotificationEntry[];

const resetUnseen = (draft: State, payload?: State) => {
    if (!payload) {
        draft.forEach(n => {
            if (!n.seen) n.seen = true;
        });
    } else {
        payload.forEach(p => {
            const item = draft.find(n => n.id === p.id);
            if (item) item.seen = true;
        });
    }
};

const remove = (draft: State, payload: State | NotificationEntry) => {
    const arr = !Array.isArray(payload) ? [payload] : payload;
    arr.forEach(item => {
        const index = draft.findIndex(n => n.id === item.id);
        draft.splice(index, 1);
    });
};

export default function notification(state: State = [], action: Action): State {
    return produce(state, draft => {
        switch (action.type) {
            case NOTIFICATION.TOAST:
            case NOTIFICATION.EVENT:
                draft.unshift(action.payload);
                break;
            case NOTIFICATION.CLOSE: {
                const item = draft.find(n => n.id === action.payload);
                if (item) item.closed = true;
                break;
            }
            case NOTIFICATION.RESET_UNSEEN:
                resetUnseen(draft, action.payload);
                break;
            case NOTIFICATION.REMOVE:
                remove(draft, action.payload);
                break;
            // no default
        }
    });
}

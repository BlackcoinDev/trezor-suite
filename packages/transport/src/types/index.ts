export * as Messages from './messages';

export type TrezorDeviceInfo = {
    path: string;
};

export type TrezorDeviceInfoDebug = {
    path: string;
};

export type TrezorDeviceInfoWithSession = TrezorDeviceInfo & {
    session?: string | null;
};

export type AcquireInput = {
    path: string;
    previous?: string;
};

export type MessageFromTrezor = { type: string; message: Record<string, unknown> };

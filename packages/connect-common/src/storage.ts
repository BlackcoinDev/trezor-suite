// https://github.com/trezor/connect/blob/develop/src/js/storage/index.js
const storageVersion = 1;
const storageName = `storage_v${storageVersion}`;

export const BROWSER_KEY = 'browser';
export const PERMISSIONS_KEY = 'permissions';
export const TRACKING_ENABLED = 'tracking_enabled';
export const TRACKING_ID = 'tracking_id';

interface Permission {
    type: string;
    origin?: string;
    device?: string;
}

export interface Store {
    [BROWSER_KEY]?: boolean;
    [PERMISSIONS_KEY]?: Permission[];
    [TRACKING_ID]?: string;
    [TRACKING_ENABLED]?: boolean;
}

type SaveCallback = (state: Store, setState: (newState: Store) => void) => void;

let memoryStorage: Store = {};

const getPermanentStorage = () => {
    const ls = localStorage.getItem(storageName);

    return ls ? JSON.parse(ls) : {};
};

export const save = (saveCallback: SaveCallback, temporary = false) => {
    if (temporary) {
        saveCallback(memoryStorage, store => {
            memoryStorage = store;
        });
        return;
    }
    const storage = getPermanentStorage();
    saveCallback(storage, store => localStorage.setItem(storageName, JSON.stringify(store)));
};

export const load = (temporary = false): Store => {
    if (temporary) {
        return memoryStorage;
    }

    return getPermanentStorage();
};

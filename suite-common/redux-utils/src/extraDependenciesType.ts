import { ActionCreatorWithPreparedPayload } from '@reduxjs/toolkit';

import { Account, FeeInfo } from '@suite-common/wallet-types';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { TrezorDevice } from '@suite-common/suite-types';
import { BlockchainBlock, ConnectSettings, Manifest, PROTO } from '@trezor/connect';
import { NotificationEventPayload } from '@suite-common/notifications';

import { ActionType, SuiteCompatibleSelector, SuiteCompatibleThunk } from './types';

type StorageLoadReducer = (state: any, action: { type: any; payload: any }) => void;
type StorageLoadTransactionsReducer = (state: any, action: { type: any; payload: any }) => void;

type ConnectInitSettings = {
    manifest: Manifest;
} & Partial<ConnectSettings>;

export type ExtraDependencies = {
    thunks: {
        notificationsAddEvent: SuiteCompatibleThunk<NotificationEventPayload>;
        cardanoValidatePendingTxOnBlock: SuiteCompatibleThunk<{
            block: BlockchainBlock;
            timestamp: number;
        }>;
        cardanoFetchTrezorPools: SuiteCompatibleThunk<'ADA' | 'tADA'>;
    };
    selectors: {
        selectFeeInfo: (networkSymbol: NetworkSymbol) => SuiteCompatibleSelector<FeeInfo>;
        selectDevices: SuiteCompatibleSelector<TrezorDevice[]>;
        selectBitcoinAmountUnit: SuiteCompatibleSelector<PROTO.AmountUnit>;
        selectEnabledNetworks: SuiteCompatibleSelector<NetworkSymbol[]>;
        selectLocalCurrency: SuiteCompatibleSelector<string>;
        selectIsPendingTransportEvent: SuiteCompatibleSelector<boolean>;
    };
    // You should only use ActionCreatorWithPayload from redux-toolkit!
    // That means you will need to convert actual action creators in packages/suite to use createAction from redux-toolkit,
    // but that shouldn't be problem.
    actions: {
        setAccountLoadedMetadata: ActionCreatorWithPreparedPayload<[payload: Account], Account>;
        setAccountAddMetadata: ActionCreatorWithPreparedPayload<[payload: Account], Account>;
        setWalletSettingsLocalCurrency: ActionCreatorWithPreparedPayload<
            [localCurrency: string],
            {
                localCurrency: string;
            }
        >;
        changeWalletSettingsNetworks: ActionCreatorWithPreparedPayload<
            [payload: NetworkSymbol[]],
            NetworkSymbol[]
        >;
        lockDevice: ActionCreatorWithPreparedPayload<[payload: boolean], boolean>;
    };
    // Use action types + reducers as last resort if you can't use actions creators. For example for storageLoad it is used because
    // it would be really hard to move all types to @suite-common that are needed to type payload. This comes at cost of
    // having "any" type for action.payload in reducer. We can overcome this issue if we define reducers of storageLoad
    // in place where we have all types available to ensure type safety.
    actionTypes: {
        storageLoad: ActionType;
    };
    reducers: {
        storageLoadBlockchain: StorageLoadReducer;
        storageLoadAccounts: StorageLoadReducer;
        storageLoadTransactions: StorageLoadTransactionsReducer;
        storageLoadFiatRates: StorageLoadReducer;
    };
    utils: {
        saveAs: (data: Blob, fileName: string) => void;
        connectInitSettings: ConnectInitSettings;
    };
};

export type ExtraDependenciesPartial = {
    [K in keyof ExtraDependencies]?: Partial<ExtraDependencies[K]>;
};

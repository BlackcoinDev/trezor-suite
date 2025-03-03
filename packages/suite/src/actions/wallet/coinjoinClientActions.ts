import { CoinjoinStatus } from '@trezor/coinjoin';
import { AccountInfo } from '@trezor/connect';
import * as COINJOIN from './constants/coinjoinConstants';
import { addToast } from '../suite/notificationActions';
import { CoinjoinClientService } from '@suite/services/coinjoin/coinjoinClient';
import { Dispatch } from '@suite-types';
import { Account } from '@suite-common/wallet-types';

const clientEnable = (symbol: Account['symbol']) =>
    ({
        type: COINJOIN.CLIENT_ENABLE,
        payload: {
            symbol,
        },
    } as const);

export const clientDisable = (symbol: Account['symbol']) =>
    ({
        type: COINJOIN.CLIENT_DISABLE,
        payload: {
            symbol,
        },
    } as const);

const clientEnableSuccess = (symbol: Account['symbol'], status: CoinjoinStatus) =>
    ({
        type: COINJOIN.CLIENT_ENABLE_SUCCESS,
        payload: {
            symbol,
            status,
        },
    } as const);

const clientEnableFailed = (symbol: Account['symbol']) =>
    ({
        type: COINJOIN.CLIENT_ENABLE_FAILED,
        payload: {
            symbol,
        },
    } as const);

export type CoinjoinClientAction =
    | ReturnType<typeof clientEnable>
    | ReturnType<typeof clientDisable>
    | ReturnType<typeof clientEnableSuccess>
    | ReturnType<typeof clientEnableFailed>;

export const initCoinjoinClient = (symbol: Account['symbol']) => async (dispatch: Dispatch) => {
    // find already running instance of @trezor/coinjoin client
    const knownClient = CoinjoinClientService.getInstance(symbol);
    if (knownClient) {
        return knownClient;
    }

    // or start new instance
    dispatch(clientEnable(symbol));

    const client = await CoinjoinClientService.createInstance(symbol);
    try {
        const status = await client.enable();
        dispatch(clientEnableSuccess(symbol, status));
        return client;
    } catch (error) {
        CoinjoinClientService.removeInstance(symbol);
        dispatch(clientEnableFailed(symbol));
        dispatch(
            addToast({
                type: 'error',
                error: `Coinjoin client not enabled: ${error.message}`,
            }),
        );
    }
};

// return only active instances
export const getCoinjoinClient = (symbol: Account['symbol']) => () =>
    CoinjoinClientService.getInstance(symbol);

// NOTE: this function will be extended in upcoming PR
export const analyzeTransactions = (accountInfo: AccountInfo) => async () => {
    if (!accountInfo.utxo || !accountInfo.addresses) return accountInfo;

    // TODO: async call on CoinjoinClient.analyzeTransactions
    const { utxo } = accountInfo;
    const anonymitySet: Record<string, number> = await new Promise(resolve => {
        const aSet = utxo.reduce((res, utxo) => {
            res[utxo.address] = 1;
            return res;
        }, {} as typeof anonymitySet);
        resolve(aSet);
    });

    const accountInfoWithAnonymitySet = {
        ...accountInfo,
        addresses: {
            ...accountInfo.addresses,
            anonymitySet,
        },
    };

    return accountInfoWithAnonymitySet;
};

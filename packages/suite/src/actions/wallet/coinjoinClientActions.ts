import { CoinjoinStatusEvent, CoinjoinClientEvent, ActiveRound } from '@trezor/coinjoin';
import * as COINJOIN from './constants/coinjoinConstants';
import { addToast } from '../suite/notificationActions';
import { CoinjoinClientService } from '@suite/services/coinjoin/coinjoinClient';
import { Dispatch, GetState } from '@suite-types';
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

const clientEnableSuccess = (symbol: Account['symbol'], status: CoinjoinStatusEvent) =>
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

const clientOnStatusEvent = (symbol: Account['symbol'], status: CoinjoinStatusEvent) =>
    ({
        type: COINJOIN.CLIENT_STATUS,
        payload: {
            symbol,
            status,
        },
    } as const);

const clientActiveRoundChanged = (accountKey: string, round: ActiveRound) =>
    ({
        type: COINJOIN.ROUND_PHASE_CHANGED,
        accountKey,
        round,
    } as const);

const clientActiveRoundCompleted = (accountKey: string, round: ActiveRound) =>
    ({
        type: COINJOIN.ROUND_COMPLETED,
        accountKey,
        round,
    } as const);

const clientSessionCompleted = (accountKey: string) =>
    ({
        type: COINJOIN.SESSION_COMPLETED,
        accountKey,
    } as const);

export type CoinjoinClientAction =
    | ReturnType<typeof clientEnable>
    | ReturnType<typeof clientDisable>
    | ReturnType<typeof clientEnableSuccess>
    | ReturnType<typeof clientEnableFailed>
    | ReturnType<typeof clientOnStatusEvent>
    | ReturnType<typeof clientActiveRoundChanged>
    | ReturnType<typeof clientActiveRoundCompleted>
    | ReturnType<typeof clientSessionCompleted>;

const onCoinjoinClientEvent =
    (_network: Account['symbol'], event: CoinjoinClientEvent) =>
    (dispatch: Dispatch, getState: GetState) => {
        if (event.type === 'round-change') {
            const round = event.payload;
            const { accounts } = getState().wallet.coinjoin;
            const accountsInRound = Object.keys(round.accounts);

            const coinjoinAccounts = accountsInRound.flatMap(
                accountKey => accounts.find(r => r.key === accountKey && r.session) || [],
            );

            // const client = coinjoinClients.find(c => c.settings.network === network);
            coinjoinAccounts.forEach(account => {
                if (account.session?.phase !== round.phase) {
                    dispatch(clientActiveRoundChanged(account.key, round));

                    if (round.phase === 4) {
                        if (account.session?.signedRounds.length === account.session?.maxRounds) {
                            // const account = getState().wallet.accounts.find(a => a.key === accountKey);
                            // client.unregisterAccount(reg.accountKey);
                            dispatch(clientSessionCompleted(account.key));

                            dispatch(
                                addToast({
                                    type: 'coinjoin-complete',
                                }),
                            );
                            // const client = coinjoinClients.find(
                            //     c => c.settings.network === network,
                            // );
                            // client?.unregisterAccount(reg.accountKey);
                        } else if (round.coinjoinState.isFullySigned) {
                            dispatch(clientActiveRoundCompleted(account.key, round));

                            dispatch(
                                addToast({
                                    type: 'coinjoin-round-complete',
                                }),
                            );
                        }
                    }
                }
            });
        }
    };

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
        if (!status) {
            throw new Error('status is missing');
        }
        // handle status change
        client.on('status', status => dispatch(clientOnStatusEvent(symbol, status)));
        // handle active round change
        client.on('event', event => {
            dispatch(onCoinjoinClientEvent(symbol, event));
        });
        dispatch(clientEnableSuccess(symbol, status));
        return client;
    } catch (error) {
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

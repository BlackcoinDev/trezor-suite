import {
    Account,
    ExportFileType,
    PrecomposedTransactionFinal,
    TxFinalCardano,
    WalletAccountTransaction,
} from '@suite-common/wallet-types';
import {
    findTransactions,
    formatData,
    getAccountTransactions,
    getExportedFileName,
    isTrezorConnectBackendType,
} from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { createThunk } from '@suite-common/redux-utils';
import { AccountKey } from '@suite-common/suite-types';

import { accountsActions } from '../accounts/accountsActions';
import { selectTransactions } from './transactionsReducer';
import { transactionsActions, modulePrefix } from './transactionsActions';
import { selectAccountByKey } from '../accounts/accountsReducer';

/**
 * Replace existing transaction in the reducer.
 * There might be multiple occurrences of the same transaction assigned to multiple accounts in the storage:
 * sender account and receiver account(s)
 */
export const replaceTransactionThunk = createThunk(
    `${modulePrefix}/replaceTransactionThunk`,
    (
        {
            tx,
            newTxid,
        }: {
            tx: PrecomposedTransactionFinal;
            newTxid: string;
        },
        { getState, dispatch },
    ) => {
        if (!tx.prevTxid) return; // ignore if it's not replacement tx

        const walletTransactions = selectTransactions(getState());

        // find all transactions to replace, they may be related to another account
        const transactions = findTransactions(tx.prevTxid, walletTransactions);
        const newBaseFee = parseInt(tx.fee, 10);

        // prepare replace actions for txs
        const actions = transactions.map(t => {
            // type: transactionsActions.replaceTransaction.type,
            const payload: { key: string; txid: string; tx: WalletAccountTransaction } = {
                key: t.key,
                txid: tx.prevTxid,
                tx: {
                    ...t.tx,
                    txid: newTxid,
                    fee: tx.fee,
                    rbf: !!tx.rbf,
                    blockTime: Math.round(new Date().getTime() / 1000),
                    // TODO: details: {}, is it worth it?
                },
            };
            // finalized and recv tx shouldn't have rbfParams
            if (!tx.rbf || t.tx.type === 'recv') {
                delete payload.tx.rbfParams;
                return transactionsActions.replaceTransaction(payload);
            }

            if (payload.tx.type === 'self') {
                payload.tx.amount = tx.fee;
            }
            // update tx rbfParams
            if (payload.tx.rbfParams) {
                payload.tx.rbfParams = {
                    ...payload.tx.rbfParams,
                    txid: newTxid,
                    baseFee: newBaseFee,
                    feeRate: tx.feePerByte,
                };
            }
            return transactionsActions.replaceTransaction(payload);
        });
        // dispatch replace actions
        actions.forEach(a => dispatch(a));
    },
);

export const addFakePendingTxThunk = createThunk(
    `${modulePrefix}/addFakePendingTransaction`,
    (
        {
            precomposedTx,
            txid,
            account,
        }: {
            precomposedTx: Pick<PrecomposedTransactionFinal | TxFinalCardano, 'totalSpent' | 'fee'>;
            txid: string;
            account: Account;
        },
        { dispatch },
    ) => {
        // Used in cardano send form and staking tab until Blockfrost supports pending txs on its backend
        // https://github.com/trezor/trezor-suite/issues/4932
        const fakeTx = {
            type: 'sent' as const,
            txid,
            blockTime: Math.floor(new Date().getTime() / 1000),
            blockHash: undefined,
            // amounts (as most of props below) don't matter much since it is temp fake anyway
            amount: precomposedTx.totalSpent,
            fee: precomposedTx.fee,
            totalSpent: precomposedTx.totalSpent,
            targets: [],
            tokens: [],
            cardanoSpecific: {
                subtype: null,
            },
            details: {
                vin: [],
                vout: [],
                size: 0,
                totalInput: '0',
                totalOutput: '0',
            },
        };
        dispatch(transactionsActions.addTransaction({ transactions: [fakeTx], account }));
    },
);

export const exportTransactionsThunk = createThunk(
    `${modulePrefix}/exportTransactions`,
    async (
        {
            account,
            accountName,
            type,
        }: {
            account: Account;
            accountName: string;
            type: ExportFileType;
        },
        { getState, extra },
    ) => {
        const { utils, selectors } = extra;
        // Get state of transactions
        const allTransactions = selectTransactions(getState());
        const localCurrency = selectors.selectLocalCurrency(getState());
        const transactions = getAccountTransactions(
            account.key,
            allTransactions,
            // add metadata directly to transactions
        ).map(transaction => ({
            ...transaction,
            targets: transaction.targets.map(target => ({
                ...target,
                metadataLabel: account.metadata?.outputLabels?.[transaction.txid]?.[target.n],
            })),
        }));

        // Prepare data in right format
        const data = await formatData({
            coin: account.symbol,
            accountName,
            type,
            transactions,
            localCurrency,
        });

        // Save file
        const fileName = getExportedFileName(accountName, type);

        utils.saveAs(data, fileName);
    },
);

export const fetchTransactionsThunk = createThunk(
    `${modulePrefix}/fetchTransactionsThunk`,
    async (
        {
            accountKey,
            page,
            perPage,
            noLoading = false,
            recursive = false,
        }: {
            accountKey: AccountKey;
            page: number;
            perPage: number;
            noLoading?: boolean;
            recursive?: boolean;
        },
        { dispatch, getState, signal },
    ) => {
        const account = selectAccountByKey(getState(), accountKey);
        if (!account) return;
        if (!isTrezorConnectBackendType(account.backendType)) return; // skip unsupported backend type
        const transactions = selectTransactions(getState());
        const reducerTxs = getAccountTransactions(account.key, transactions);

        const startIndex = (page - 1) * perPage;
        const stopIndex = startIndex + perPage;
        const txsForPage = reducerTxs.slice(startIndex, stopIndex).filter(tx => !!tx.txid); // filter out "empty" values

        // we already got txs for the page in reducer
        if (
            (page > 1 && txsForPage.length === perPage) ||
            txsForPage.length === account.history.total
        ) {
            if (recursive && !signal.aborted) {
                const promise = dispatch(
                    fetchTransactionsThunk({
                        accountKey,
                        page: page + 1,
                        perPage,
                        noLoading,
                        recursive: true,
                    }),
                );
                signal.addEventListener('abort', () => {
                    promise.abort();
                });
                await promise;
            }

            return;
        }

        if (!noLoading && !signal.aborted) {
            dispatch(transactionsActions.fetchInit);
        }

        const { marker } = account;
        const result = await TrezorConnect.getAccountInfo({
            coin: account.symbol,
            descriptor: account.descriptor,
            details: 'txs',
            page, // useful for every network except ripple
            pageSize: perPage,
            ...(marker ? { marker } : {}), // set marker only if it is not undefined (ripple), otherwise it fails on marker validation
        });

        if (signal.aborted) return;

        if (result && result.success) {
            // TODO why is this only accepting account now?
            const updateAction = accountsActions.updateAccount(account, result.payload);
            const updatedAccount = updateAction.payload as Account;
            const updatedTransactions = result.payload.history.transactions || [];
            const totalPages = result.payload.page?.total || 0;

            dispatch(transactionsActions.fetchSuccess);
            dispatch(
                transactionsActions.addTransaction({
                    transactions: updatedTransactions,
                    account: updatedAccount,
                    page,
                    perPage,
                }),
            );
            // updates the marker/page object for the account
            dispatch(updateAction);

            // totalPages (blockbook + blockfrost), marker (ripple) if is undefined, no more pages are available
            if (
                recursive &&
                (page < totalPages || (marker && updatedAccount.marker)) &&
                !signal.aborted
            ) {
                const promise = dispatch(
                    fetchTransactionsThunk({
                        accountKey: updatedAccount.key,
                        page: page + 1,
                        perPage,
                        noLoading,
                        recursive: true,
                    }),
                );
                signal.addEventListener('abort', () => {
                    promise.abort();
                });
                await promise;
            }
        } else {
            dispatch(
                transactionsActions.fetchError({
                    error: result ? result.payload.error : 'unknown error',
                }),
            );
        }
    },
);

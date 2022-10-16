import { address as addressBjs, Network } from '@trezor/utxo-lib';

import * as middleware from '../middleware';
import { Transaction } from '../../types/backend';
import {
    AnalyzeTransactionDetails,
    AnalyzeInternalVinVout,
    AnalyzeExternalVinVout,
} from '../../types/middleware';

interface AnalyzeTransactionsOptions {
    network: Network;
    middlewareUrl: string;
    signal: AbortSignal;
}

const transformVinVout = (vinvout: Transaction['details']['vin'][number], network: Network) => {
    const address = vinvout.addresses!.join('');
    const value = Number(vinvout.value);

    if (vinvout.isAccountOwned) return { address, value } as AnalyzeInternalVinVout;

    const scriptPubKey = addressBjs.toOutputScript(address, network).toString('hex');
    return {
        scriptPubKey,
        value,
    } as AnalyzeExternalVinVout;
};

/**
 * Get transactions from CoinjoinBackend.getAccountInfo and calculate anonymity in middleware.
 * Returns { key => value } where `key` is an address and `value` is an anonymity level of that address
 */
export const analyzeTransactions = async (
    transactions: Transaction[],
    options: AnalyzeTransactionsOptions,
) => {
    const params = transactions.map(tx => {
        const detail: AnalyzeTransactionDetails = {
            internalInputs: [],
            externalInputs: [],
            internalOutputs: [],
            externalOutputs: [],
        };

        tx.details.vin.forEach(vin => {
            const vinvout = transformVinVout(vin, options.network);
            if ('address' in vinvout) {
                detail.internalInputs.push(vinvout);
            } else {
                detail.externalInputs.push(vinvout);
            }
        });

        tx.details.vout.forEach(vout => {
            const vinvout = transformVinVout(vout, options.network);
            if ('address' in vinvout) {
                detail.internalOutputs.push(vinvout);
            } else {
                detail.externalOutputs.push(vinvout);
            }
        });

        return detail;
    });

    const result = await middleware.analyzeTransactions(params, {
        baseUrl: options.middlewareUrl,
        signal: options.signal,
    });

    return result.reduce((dict, { address, anonymitySet }) => {
        dict[address] = anonymitySet;
        return dict;
    }, {} as Record<string, number>);
};

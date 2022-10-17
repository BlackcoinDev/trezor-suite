import BigNumber from 'bignumber.js';
import { getUtxoOutpoint, getBip43Type } from '@suite-common/wallet-utils';
import { Account, CoinjoinSessionParameters } from '@suite-common/wallet-types';
import { Account as CoinjoinAccount } from '@trezor/coinjoin';

export type CoinjoinBalanceBreakdown = {
    notAnonymized: string;
    anonymizing: string;
    anonymized: string;
};

/**
 * Breaks down account balance based on anonymity status
 */
export const breakdownCoinjoinBalance = ({
    targetAnonymity,
    anonymitySet,
    utxos,
    registeredUtxos,
}: {
    targetAnonymity: number | undefined;
    anonymitySet: Record<string, number | undefined> | undefined;
    utxos: Account['utxo'];
    registeredUtxos?: string[];
}): CoinjoinBalanceBreakdown => {
    const balanceBreakdown = {
        notAnonymized: '0',
        anonymizing: '0',
        anonymized: '0',
    };

    if (!anonymitySet || targetAnonymity === undefined || !utxos) {
        return balanceBreakdown;
    }

    utxos?.forEach(({ address, amount, txid, vout }) => {
        const outpoint = getUtxoOutpoint({ txid, vout });
        const bigAmount = new BigNumber(amount);
        const { notAnonymized, anonymizing, anonymized } = balanceBreakdown;

        if (registeredUtxos?.includes(outpoint)) {
            const newAnonymizing = new BigNumber(anonymizing).plus(bigAmount);

            balanceBreakdown.anonymizing = newAnonymizing.toString();
        } else if ((anonymitySet[address] || 0) < targetAnonymity) {
            const newNotAnonymized = new BigNumber(notAnonymized).plus(bigAmount);

            balanceBreakdown.notAnonymized = newNotAnonymized.toString();
        } else if ((anonymitySet[address] || 0) >= targetAnonymity) {
            const newAnonymized = new BigNumber(anonymized).plus(bigAmount);

            balanceBreakdown.anonymized = newAnonymized.toString();
        }
    });

    return balanceBreakdown;
};

// convert suite account type to @trezor/coinjoin (Wasabi) account type
const getAccountType = (path: string) => {
    const bip43 = getBip43Type(path);
    switch (bip43) {
        case 'bip86':
        case 'slip25':
            return 'Taproot';
        case 'bip84':
            return 'P2WPKH';
        default:
            return 'P2WPKH';
    }
};

const getUtxos = (utxos: Account['utxo']) =>
    utxos
        ?.filter(utxo => utxo.confirmations) // TODO: filter anonymized and "out of the basket" utxos
        .map(utxo => ({
            ...utxo,
            outpoint: getUtxoOutpoint(utxo),
            amount: Number(utxo.amount),
        }));

// transform suite Account to @trezor/coinjoin Account
// TODO: validate and throw errors (account type, symbol)
export const sanitizeAccount = (
    account: Account,
    params: CoinjoinSessionParameters,
): CoinjoinAccount => ({
    type: getAccountType(account.path),
    symbol: account.symbol as any,
    descriptor: account.key,
    anonymityLevel: 0,
    maxRounds: params.maxRounds,
    maxFeePerKvbyte: params.maxFeePerKvbyte,
    maxCoordinatorFeeRate: params.maxCoordinatorFeeRate,
    utxos: getUtxos(account.utxo) || [],
    addresses: account.addresses!.change,
});

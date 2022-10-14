import BigNumber from 'bignumber.js';
import { CoinjoinStatusEvent } from '@trezor/coinjoin';
import { getUtxoOutpoint } from '@suite-common/wallet-utils';
import { Account } from '@suite-common/wallet-types';

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

/**
 * Transform from coordinator format to coinjoinReducer format `CoinjoinClientFeeRatesMedians`
 * array => object { name: value-in-vbytes }
 */
export const transformFeeRatesMedians = (m: CoinjoinStatusEvent['feeRatesMedians']) => {
    const [fast, recommended, slow] = m.map(f => f.medianFeeRate);
    const kb2b = (v: number) => (v ? Math.round(v / 1000) : 1);
    return {
        fast: kb2b(fast) * 2, // NOTE: this calculation will be smarter once have enough data
        recommended: kb2b(recommended),
        slow: kb2b(slow),
    };
};

/**
 * Transform from coordinator format to coinjoinReducer format `CoinjoinClientInstance`
 * - coordinatorFeeRate: multiplied by 10. representation of percentage value
 * - feeRatesMedians: array => object with values in vbytes
 */
export const transformCoinjoinStatus = (e: CoinjoinStatusEvent) => ({
    rounds: e.rounds.map(r => ({ id: r.id, phase: r.phase })),
    coordinatorFeeRate: e.coordinatorFeeRate * 10,
    feeRatesMedians: transformFeeRatesMedians(e.feeRatesMedians),
});

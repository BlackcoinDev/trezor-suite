import React from 'react';
import styled, { css } from 'styled-components';

import * as modalActions from '@suite-actions/modalActions';
import { FiatValue, FormattedCryptoAmount, MetadataLabeling, Translation } from '@suite-components';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { useActions, useSelector } from '@suite-hooks';
import { useTheme, Checkbox, FluidSpinner, Icon, Tooltip, variables } from '@trezor/components';
import type { AccountUtxo } from '@trezor/connect';
import { TransactionTimestamp } from '@wallet-components';
import { useSendFormContext } from '@wallet-hooks';
import { WalletAccountTransaction } from '@wallet-types';
import { darken } from 'polished';

const VisibleOnHover = styled.div<{ alwaysVisible?: boolean }>`
    display: ${({ alwaysVisible }) => (alwaysVisible ? 'contents' : 'none')};
`;

const StyledCheckbox = styled(Checkbox)<{ isChecked: boolean; $isGrey: boolean }>`
    margin-top: 2px;
    ${({ isChecked, $isGrey, theme }) =>
        isChecked &&
        $isGrey &&
        css`
            > div:first-child {
                background: ${theme.TYPE_LIGHTER_GREY};
            }

            :not(:hover) > div:first-child {
                border: 2px solid ${theme.TYPE_LIGHTER_GREY};
            }
        `};
`;

const Wrapper = styled.div`
    align-items: flex-start;
    border-radius: 8px;
    display: flex;
    margin: 1px -12px;
    padding: 12px 12px 8px;
    transition: background 0.25s ease-out;
    cursor: pointer;

    &:hover {
        background: ${({ theme }) => theme.BG_GREY};
        ${StyledCheckbox} > :first-child {
            border-color: ${({ theme }) => darken(theme.HOVER_DARKEN_FILTER, theme.STROKE_GREY)};
        }
        ${VisibleOnHover} {
            display: contents;
        }
    }
`;

const Body = styled.div`
    flex-grow: 1;
    /* prevent overflow if contents (e.g. label) are too long */
    min-width: 0;
`;

const Row = styled.div`
    align-items: center;
    display: flex;
    gap: 8px;
`;

const BottomRow = styled(Row)`
    margin-top: 6px;
    min-height: 24px;
`;

const Dot = styled.div`
    border-radius: 50%;
    background: ${props => props.theme.TYPE_LIGHT_GREY};
    height: 3px;
    width: 3px;
`;

const Address = styled.div`
    overflow: hidden;
    text-overflow: ellipsis;
`;

const StyledCryptoAmount = styled(FormattedCryptoAmount)`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-left: auto;
    padding-left: 4px;
    white-space: nowrap;
`;

const TransactionDetail = styled.button`
    background: none;
    border: none;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    cursor: pointer;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    padding: 0;
    text-decoration: underline;

    &:hover {
        color: ${({ theme }) => theme.TYPE_DARK_GREY};
    }
`;

const IconWrapper = styled.div`
    margin-right: 8px;
`;

const StyledFiatValue = styled(FiatValue)`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-left: auto;
    padding-left: 4px;
`;

interface UtxoSelectionProps {
    isChecked: boolean;
    transaction?: WalletAccountTransaction;
    utxo: AccountUtxo;
}

export const UtxoSelection = ({ isChecked, transaction, utxo }: UtxoSelectionProps) => {
    const device = useSelector(state => state.suite.device);
    const { openModal } = useActions({
        openModal: modalActions.openModal,
    });

    const { account, network, selectedUtxos, toggleUtxoSelection } = useSendFormContext();
    const theme = useTheme();

    const isChangeAddress = utxo.path.split('/')[4] === '1';
    const amountInBtc = (Number(utxo.amount) / 10 ** network.decimals).toString();
    const outputLabel = account.metadata.outputLabels?.[utxo.txid]?.[utxo.vout];
    const isLabelingPossible = device?.metadata.status === 'enabled' || device?.connected;

    const handleCheckbox = () => toggleUtxoSelection(utxo);
    const showTransactionDetail: React.MouseEventHandler = e => {
        e.stopPropagation(); // do not trigger the checkbox
        if (transaction) {
            openModal({ type: 'transaction-detail', tx: transaction });
        }
    };

    return (
        <Wrapper onClick={handleCheckbox}>
            <StyledCheckbox
                $isGrey={!selectedUtxos.length}
                isChecked={isChecked}
                onClick={handleCheckbox}
            />
            <Body>
                <Row>
                    {isChangeAddress && (
                        <Tooltip
                            interactive={false}
                            cursor="pointer"
                            content={<Translation id="TR_CHANGE_ADDRESS_TOOLTIP" />}
                        >
                            <Icon icon="CHANGE_ADDRESS" color={theme.TYPE_DARK_GREY} size={16} />
                        </Tooltip>
                    )}
                    <Address>{utxo.address}</Address>
                    <StyledCryptoAmount
                        value={formatNetworkAmount(utxo.amount, account.symbol)}
                        symbol={account.symbol}
                    />
                </Row>
                <BottomRow>
                    {transaction ? (
                        <TransactionTimestamp showDate transaction={transaction} />
                    ) : (
                        <IconWrapper>
                            <FluidSpinner color={theme.TYPE_LIGHT_GREY} size={14} />
                        </IconWrapper>
                    )}
                    {isLabelingPossible && (
                        <VisibleOnHover alwaysVisible={!!outputLabel}>
                            <Dot />
                            <MetadataLabeling
                                visible
                                payload={{
                                    type: 'outputLabel',
                                    accountKey: account.key,
                                    txid: utxo.txid,
                                    outputIndex: utxo.vout,
                                    defaultValue: `${utxo.txid}-${utxo.vout}`,
                                    value: outputLabel,
                                }}
                            />
                        </VisibleOnHover>
                    )}
                    {transaction && (
                        <VisibleOnHover>
                            <Dot />
                            <TransactionDetail onClick={showTransactionDetail}>
                                <Translation id="TR_DETAIL" />
                            </TransactionDetail>
                        </VisibleOnHover>
                    )}
                    <StyledFiatValue amount={amountInBtc} symbol={network.symbol} />
                </BottomRow>
            </Body>
        </Wrapper>
    );
};

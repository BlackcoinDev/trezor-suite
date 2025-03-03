import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { FormattedCryptoAmount, Translation } from '@suite-components';
import { useFormatters } from '@suite-common/formatters';
import { NetworkSymbol } from '@wallet-types';

const SummaryWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    border-top: 1px solid ${props => props.theme.BG_GREY};
    border-bottom: 1px solid ${props => props.theme.BG_GREY};
    margin: 34px 0;
    padding: 14px 0;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Left = styled.div`
    display: flex;
    font-size: 16px;
    line-height: 24px;
    align-items: center;
`;

const Right = styled.div`
    display: flex;
    flex-direction: column;
`;

const Fiat = styled.div`
    font-size: 20px;
    line-height: 28px;
    color: ${props => props.theme.TYPE_GREEN};
    justify-content: end;
    display: flex;
`;

const Crypto = styled.div`
    font-size: 20px;
    line-height: 28px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    justify-content: end;
    display: flex;
`;

interface Props {
    fiatCurrency?: string;
    annualSavingsFiatAmount: number;
    annualSavingsCryptoAmount: string;
    accountSymbol: NetworkSymbol;
}

const Summary = ({
    accountSymbol,
    annualSavingsCryptoAmount,
    annualSavingsFiatAmount,
    fiatCurrency,
}: Props) => {
    const { FiatAmountFormatter } = useFormatters();

    return (
        <SummaryWrapper>
            <Left>
                <Translation id="TR_SAVINGS_SETUP_SUMMARY_LABEL" />
            </Left>
            <Right>
                <Fiat>
                    <FiatAmountFormatter currency={fiatCurrency} value={annualSavingsFiatAmount} />
                </Fiat>
                <Crypto>
                    ≈&nbsp;
                    <FormattedCryptoAmount
                        value={annualSavingsCryptoAmount}
                        symbol={accountSymbol}
                    />
                </Crypto>
            </Right>
        </SummaryWrapper>
    );
};

export default Summary;

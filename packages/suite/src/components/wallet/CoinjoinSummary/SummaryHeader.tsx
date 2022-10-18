import React from 'react';
import styled from 'styled-components';
import { H3 } from '@trezor/components';
import { AnonymityIndicator } from '@wallet-components/PrivacyAccount/AnonymityIndicator';
import { Translation } from '@suite-components/Translation';

const Row = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28px;
`;

const StyledAnonymityIndicator = styled(AnonymityIndicator)`
    margin-left: auto;
`;

export const SummaryHeader = () => (
    <Row>
        <H3>
            <Translation id="TR_MY_COINS" />
        </H3>
        <StyledAnonymityIndicator />
    </Row>
);

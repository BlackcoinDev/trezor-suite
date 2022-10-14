import React from 'react';
import styled from 'styled-components';

import { useSelector } from '@suite-hooks';
import { WalletLayoutHeader } from '@wallet-components';
import { AnonymityLevelIndicator } from '@wallet-components/PrivacyAccount/AnonymityLevelIndicator';
import { CoinjoinSetupStrategies } from '@wallet-views/anonymize/components/CoinjoinSetupStrategies';
import { WalletLayout } from '@wallet-components/WalletLayout';

const AnynomityLevelSetupWrapper = styled.div`
    margin-right: 12px;
`;

const Anonymize = () => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    return (
        <WalletLayout title="TR_NAV_ANONYMIZE" account={selectedAccount}>
            <WalletLayoutHeader title="TR_NAV_ANONYMIZE">
                <AnynomityLevelSetupWrapper>
                    <AnonymityLevelIndicator />
                </AnynomityLevelSetupWrapper>
            </WalletLayoutHeader>
            {selectedAccount.account && (
                <CoinjoinSetupStrategies account={selectedAccount.account} />
            )}
        </WalletLayout>
    );
};

export default Anonymize;

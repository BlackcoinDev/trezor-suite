import React from 'react';
import styled from 'styled-components';

import { COINJOIN_SERVERS } from '@suite/services/coinjoin/config';
import { ActionColumn, ActionSelect, SectionItem, TextColumn } from '@suite-components/Settings';
import * as suiteActions from '@suite-actions/suiteActions';
import { useSelector, useActions } from '@suite-hooks';
import type { CoinjoinServerEnvironment } from '@suite-common/wallet-types';

const StyledActionSelect = styled(ActionSelect)`
    min-width: 256px;
`;

export const CoinjoinApi = () => {
    const { setDebugMode } = useActions({
        setDebugMode: suiteActions.setDebugMode,
    });
    const { debug } = useSelector(state => ({
        debug: state.suite.settings.debug,
    }));

    const options = Object.entries(COINJOIN_SERVERS.regtest).map(([environment, server]) => ({
        label: server,
        value: environment,
    }));
    const selectedOption =
        options.find(option => option.value === debug.coinjoinServerEnvironment) || options[0];

    const handleChange = (item: { value: CoinjoinServerEnvironment }) => {
        setDebugMode({
            coinjoinServerEnvironment: item.value,
        });
    };

    return (
        <SectionItem data-test="@settings/debug/coinjoin-api">
            <TextColumn title="Coinjoin" description="Coinjoin Regtest server" />
            <ActionColumn>
                <StyledActionSelect
                    onChange={handleChange}
                    value={selectedOption}
                    options={options}
                />
            </ActionColumn>
        </SectionItem>
    );
};

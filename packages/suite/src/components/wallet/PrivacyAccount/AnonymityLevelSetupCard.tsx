import React, { forwardRef } from 'react';
import styled from 'styled-components';
import { Card, P } from '@trezor/components';
import { Translation } from '@suite-components';

import { AnonymityLevelSlider } from './AnonymityLevelSlider';
import { DROPDOWN_MENU } from '@trezor/components/src/config/animations';

const Container = styled.div`
    position: relative;
`;

const SetupCard = styled(Card)`
    position: absolute;
    top: 12px;
    right: 0;
    width: 560px;
    box-shadow: 0px 4px 4px ${({ theme }) => theme.BOX_SHADOW_BLACK_15};
    border-radius: 16px;
    animation: ${DROPDOWN_MENU} 0.15s ease-in-out;
`;

const SliderWrapper = styled.div`
    padding-bottom: 10px;
`;

export const AnonymityLevelSetupCard = forwardRef<HTMLDivElement, {}>(({}, ref) => {
    return (
        <Container ref={ref}>
            <SetupCard>
                <P weight="medium">
                    <Translation id="TR_COINJOIN_ANONYMITY_LEVEL_SETUP_TITLE" />
                </P>
                <P size="tiny" weight="medium">
                    <Translation id="TR_COINJOIN_ANONYMITY_LEVEL_SETUP_DESCRIPTION" />
                </P>
                <SliderWrapper>
                    <AnonymityLevelSlider />
                </SliderWrapper>
            </SetupCard>
        </Container>
    );
});

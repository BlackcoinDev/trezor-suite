import React, { useEffect, useState } from 'react';

import styled from 'styled-components';

import { analytics } from '@trezor/connect-analytics';
import { DataAnalytics } from '@trezor/components';
import { storage } from '@trezor/connect-common';
import { PopupInit } from '@trezor/connect';

import { initAnalytics } from '../utils/analytics';

const Wrapper = styled.div`
    position: absolute;
    bottom: 16px;
    right: 16px;
`;

type AnalyticsConsentWrapperProps = {
    initInfo: PopupInit;
};

export const AnalyticsConsentWrapper = (initInfo: AnalyticsConsentWrapperProps) => {
    const [showAnalyticsConsent, setShowAnalyticsConsent] = useState(
        storage.load()[storage.TRACKING_ENABLED] === undefined,
    );

    useEffect(() => initAnalytics(), []);

    const onConfirm = (trackingEnabled: boolean) => {
        if (trackingEnabled) {
            analytics.enable();
            // reportConnectInit();
        } else {
            analytics.disable();
        }

        setShowAnalyticsConsent(false);
    };

    if (!showAnalyticsConsent) {
        return null;
    }

    return (
        <Wrapper>
            <DataAnalytics onConfirm={onConfirm} />
        </Wrapper>
    );
};

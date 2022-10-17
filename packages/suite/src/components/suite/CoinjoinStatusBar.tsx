import React from 'react';
import styled from 'styled-components';
import { Button, variables } from '@trezor/components';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { CoinjoinSession, RoundPhase, WalletParams } from '@suite-common/wallet-types';
import { COINJOIN_PHASE_MESSAGES } from '@suite-constants/coinjoin';
import { selectDevice } from '@suite-actions/suiteActions';
import { goto } from '@suite-actions/routerActions';
import { useSelector } from '@suite-hooks/useSelector';
import { STATUS as DiscoveryStatus } from '@wallet-actions/constants/discoveryConstants';
import { CountdownTimer } from './CountdownTimer';
import { WalletLabeling } from './Labeling';
import { ProgressPie } from './ProgressPie';
import { Translation } from './Translation';
import { useDispatch } from 'react-redux';
import { selectRouterParams } from '@suite-reducers/routerReducer';

const SPACING = 6;

const Container = styled.div`
    display: flex;
    align-items: center;
    height: 28px;
    padding: 0 ${SPACING}px;
    background: ${({ theme }) => theme.BG_WHITE};
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledProgressPie = styled(ProgressPie)`
    margin-right: ${SPACING}px;
`;

const StatusText = styled.span`
    color: ${({ theme }) => theme.TYPE_GREEN};
`;

const Note = styled.span`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const Separator = styled.span`
    margin: 0 ${SPACING / 2}px;
`;

const ViewButton = styled(Button)`
    height: 20px;
    margin-left: auto;
`;

interface CoinjoinStatusBarProps {
    accountKey: string;
    session: CoinjoinSession;
    isSingle: boolean;
}

export const CoinjoinStatusBar = ({ accountKey, session, isSingle }: CoinjoinStatusBarProps) => {
    const devices = useSelector(state => state.devices);
    const relatedAccount = useSelector(state => selectAccountByKey(state, accountKey));
    const selectedDevice = useSelector(state => state.suite.device);
    const routerParams = useSelector(selectRouterParams);
    const discovery = useSelector(state => state.wallet.discovery);

    //  ⬇️⬇️⬇️ REMOVE AFTER REVIEW ⬇️⬇️⬇️

    // will be replaced by an condition in the onCoinjoinClientEvent() action, with the same functionality
    // https://github.com/trezor/trezor-suite/blob/1be74a2f30b65f4c0aa1567e7e6208f78410256b/packages/suite/src/actions/wallet/coinjoinClientActions.ts#L135

    // useCoinjoinTracker(accountKey, session, relatedDevice);

    //  🔼🔼🔼 REMOVE AFTER REVIEW 🔼🔼🔼

    const dispatch = useDispatch();

    if (!relatedAccount) {
        return null;
    }

    const { symbol, index, accountType, deviceState } = relatedAccount;

    const relatedDevice = devices.find(device => device.state === relatedAccount?.deviceState);
    const isOnSelectedDevice = selectedDevice?.state === deviceState;

    if (!relatedDevice) {
        return null;
    }

    const handleViewAccount = () => {
        if (!isOnSelectedDevice) {
            dispatch(selectDevice(relatedDevice));
        }

        dispatch(
            goto('wallet-index', {
                params: {
                    symbol,
                    accountIndex: index,
                    accountType,
                },
            }),
        );
    };

    const { phase, signedRounds, maxRounds, deadline } = session;
    const progress = signedRounds.length / (maxRounds / 100);

    const {
        symbol: symbolParam,
        accountIndex: indexParam,
        accountType: accountTypeParam,
    } = (routerParams as WalletParams) || {};

    const isOnAccountPage =
        symbolParam === symbol && indexParam === index && accountTypeParam === accountType;

    const areDevicesDiscovered = devices.every(({ state }) =>
        discovery.find(
            discoveryState =>
                discoveryState.deviceState === state &&
                discoveryState.status === DiscoveryStatus.COMPLETED,
        ),
    );

    return (
        <Container>
            <StyledProgressPie progress={progress} />

            <StatusText>
                <Translation id={COINJOIN_PHASE_MESSAGES[phase || RoundPhase.InputRegistration]} />

                <Separator>•</Separator>

                <Translation
                    id="TR_COINJOIN_COUNTDOWN"
                    values={{ rounds: maxRounds - signedRounds.length }}
                />
            </StatusText>

            {session?.deadline && (
                <Note>
                    <Separator>•</Separator>

                    <Translation
                        id="TR_COINJOIN_ROUND_COUNTDOWN"
                        values={{
                            time: <CountdownTimer deadline={deadline} />,
                        }}
                    />
                </Note>
            )}

            {!isSingle && (
                <Note>
                    <Separator>•</Separator>
                    <WalletLabeling device={relatedDevice} shouldUseDeviceLabel />
                </Note>
            )}

            {((isOnSelectedDevice && !isOnAccountPage) ||
                (!isOnSelectedDevice && areDevicesDiscovered)) && (
                <ViewButton variant="tertiary" onClick={handleViewAccount}>
                    <Translation id="TR_VIEW" />
                </ViewButton>
            )}
        </Container>
    );
};

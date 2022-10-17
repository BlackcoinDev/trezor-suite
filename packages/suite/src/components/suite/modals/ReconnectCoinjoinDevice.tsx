import React from 'react';
import styled from 'styled-components';
import { P, useTheme, variables } from '@trezor/components';
import { ProgressPie } from '@suite-components/ProgressPie';
import { Modal, Translation, ConnectDevicePrompt } from '..';
import { transparentize } from 'polished';
import { useSelector } from '@suite-hooks/useSelector';
import { selectDeviceByState } from '@suite-reducers/deviceReducer';

const StyledModal = styled(Modal)`
    width: 430px;
`;

const StyledConnectDevicePrompt = styled(ConnectDevicePrompt)`
    height: 90px;
    min-height: unset;
    margin: 0;

    > :first-child > div {
        width: 70px;
        height: 70px;
    }
`;

const StyledProgressPie = styled(ProgressPie)`
    margin: 12px auto 22px;
`;

const TimeLeft = styled.span`
    color: ${({ theme }) => theme.TYPE_RED};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};

    ::first-letter {
        font-size: 48px;
    }
`;

const ConnectMessage = styled.p`
    margin-bottom: 32px;
    font-size: 32px;
    line-height: 32px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_RED};
`;

const Info = styled(P)`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};

    b {
        color: initial;
        font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    }
`;

interface ReconnectCoinjoinDeviceProps {
    relatedDeviceState: string;
}

export const ReconnectCoinjoinDevice = ({ relatedDeviceState }: ReconnectCoinjoinDeviceProps) => {
    const relatedDevice = useSelector(state => selectDeviceByState(state, relatedDeviceState));

    const theme = useTheme();

    const totalTime = 10;
    const timeLeft = 4;
    const progress = timeLeft / (totalTime / 100);

    return (
        <StyledModal
            modalPrompt={
                <StyledConnectDevicePrompt
                    connected={!!relatedDevice?.available}
                    showWarning={false}
                />
            }
        >
            <StyledProgressPie
                progress={progress}
                color={transparentize(0.8, theme.BG_RED)}
                backgroundColor={theme.BG_LIGHT_GREY}
                size={100}
            >
                <TimeLeft>{timeLeft}s</TimeLeft>
            </StyledProgressPie>
            <ConnectMessage>
                <Translation id="TR_CONNECT_UNLOCK_DEVICE" />
            </ConnectMessage>

            <Info>
                <Translation
                    id="TR_COINJOIN_CONNECT_DEVICE_WARNING"
                    values={{ b: chunks => <b> {chunks} </b> }}
                />
            </Info>
        </StyledModal>
    );
};

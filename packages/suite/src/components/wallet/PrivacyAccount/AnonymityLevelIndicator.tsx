import React from 'react';
import styled from 'styled-components';
import { Icon, variables } from '@trezor/components';
import { Translation } from '@suite-components';
import { useSelector } from '@suite-hooks/useSelector';
import { selectCurrentTargetAnonymity } from '@wallet-reducers/coinjoinReducer';
import { darken } from 'polished';
import { defaultColorVariant } from '@trezor/theme';

const Container = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    border-radius: 8px;

    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
    text-align: right;

    background: ${({ theme }) => theme.STROKE_GREY};

    &:hover,
    &:focus,
    &:active {
        background: ${({ theme }) => darken(theme.HOVER_DARKEN_FILTER, theme.STROKE_GREY)};
    }

    cursor: ${({ onClick }) => (onClick ? 'pointer' : 'default')};
`;

const Values = styled.div`
    min-width: 64px;
`;

const AnonymityLevel = styled.p`
    font-variant-numeric: tabular-nums;
`;

const AnonymityStatus = styled.p<{ color: string }>`
    color: ${({ color }) => color};
    font-size: ${variables.FONT_SIZE.TINY};
`;

const anonymityStatus = {
    bad: {
        label: <Translation id="TR_ANONYMITY_LEVEL_BAD" />,
        color: defaultColorVariant.red,
    },
    medium: {
        label: <Translation id="TR_ANONYMITY_LEVEL_MEDIUM" />,
        color: defaultColorVariant.yellow,
    },
    good: {
        label: <Translation id="TR_ANONYMITY_LEVEL_GOOD" />,
        color: defaultColorVariant.green,
    },
    great: {
        label: <Translation id="TR_ANONYMITY_LEVEL_GREAT" />,
        color: defaultColorVariant.forest,
    },
};

const getAnonymityStatus = (targetAnonymity: number) => {
    if (targetAnonymity < 5) {
        return anonymityStatus.bad;
    }
    if (targetAnonymity < 10) {
        return anonymityStatus.medium;
    }
    if (targetAnonymity < 20) {
        return anonymityStatus.good;
    }
    return anonymityStatus.great;
};

interface AnonymityLevelIndicatorProps {
    className?: string;
    onClick?: () => void;
}

export const AnonymityLevelIndicator = ({ className, onClick }: AnonymityLevelIndicatorProps) => {
    const targetAnonymity = useSelector(selectCurrentTargetAnonymity) || 1;

    const anonymityStatus = getAnonymityStatus(targetAnonymity);

    return (
        <Container className={className} onClick={onClick}>
            <Icon icon="USERS" />

            <Values>
                <AnonymityLevel>
                    <Translation
                        id="TR_COINJOIN_ANONYMITY_LEVEL_INDICATOR"
                        values={{ targetAnonymity }}
                    />
                </AnonymityLevel>
                <AnonymityStatus color={anonymityStatus.color}>
                    {anonymityStatus.label}
                </AnonymityStatus>
            </Values>
        </Container>
    );
};

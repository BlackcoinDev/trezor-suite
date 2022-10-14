import React, { useCallback, useState, ChangeEventHandler } from 'react';
import styled from 'styled-components';
import { Range, P, variables } from '@trezor/components';
import { useSelector, useActions } from '@suite-hooks';
import { selectSelectedAccount } from '@wallet-reducers/selectedAccountReducer';
import { selectCurrentTargetAnonymity } from '@wallet-reducers/coinjoinReducer';
import * as coinjoinActions from '@wallet-actions/coinjoinAccountActions';

const Container = styled.div`
    display: flex;
    flex-direction: column;
`;

const Slider = styled(Range)`
    padding-bottom: 50px;
    padding-top: 60px;
    margin-top: 0;

    cursor: pointer;
    background: none;
`;

const LabelsWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    pointer-events: none;

    margin-top: -46px;
    margin-bottom: -16px;
    margin-left: 10px;
`;

const Label = styled(P)`
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    opacity: 0.5;
`;

interface AnonymityLevelSliderProps {
    className?: string;
}

const trackStyle = {
    background:
        'linear-gradient(270deg, #2A9649 0%, #95CDA5 69.27%, #C8B883 81.77%, #C8B882 88.02%, #BF6767 100%);',
};

const minPosition = 0;
const maxPosition = 100;

const minValue = Math.log(1);
const maxValue = Math.log(100);

const scale = (maxValue - minValue) / (maxPosition - minPosition);

const getValue = (position: number) =>
    Math.round(Math.exp((position - minPosition) * scale + minValue));
const getPosition = (value: number) => minPosition + (Math.log(value) - minValue) / scale;

export const AnonymityLevelSlider = ({ className }: AnonymityLevelSliderProps) => {
    const currentAccount = useSelector(selectSelectedAccount);
    const targetAnonymity = useSelector(selectCurrentTargetAnonymity);

    const { coinjoinAccountUpdateAnonymity } = useActions({
        coinjoinAccountUpdateAnonymity: coinjoinActions.coinjoinAccountUpdateAnonymity,
    });

    const [sliderPosition, setSliderPosition] = useState(getPosition(targetAnonymity || 1));

    const handleSliderChange: ChangeEventHandler<HTMLInputElement> = useCallback(
        ({ target: { value } }) => {
            const position = Number(value);
            coinjoinAccountUpdateAnonymity(currentAccount?.key ?? '', getValue(position));
            setSliderPosition(position);
        },
        [coinjoinAccountUpdateAnonymity, currentAccount?.key],
    );

    if (!currentAccount) {
        return null;
    }

    return (
        <Container className={className}>
            <Slider
                value={sliderPosition}
                onChange={handleSliderChange}
                trackStyle={trackStyle}
                step={0.1}
            />
            <LabelsWrapper>
                <Label>1</Label>
                <Label>3</Label>
                <Label>10</Label>
                <Label>30</Label>
                <Label>100</Label>
            </LabelsWrapper>
        </Container>
    );
};

import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { variables, Fade } from '@trezor/components';

// due to iOS browser bug, we need to use transparent color in gradient instead of 'transparent'
const LIGHT_GREY = '#f5f5f5';
const LIGHT_GREY_TRANSPARENT = `${LIGHT_GREY}00`;

const Feature = styled.section<{ flip?: boolean }>`
    position: relative;
    display: flex;
    flex: 1;
    border-radius: 40px;
    background: ${LIGHT_GREY};
    flex-direction: ${props => (props.flip === true ? 'row-reverse' : 'row')};
    overflow: hidden;
    padding: 40px 0;

    @media only screen and (min-width: ${variables.SCREEN_SIZE.MD}) {
        min-height: 416px;
        padding: 0;
    }
`;

const StyledText = styled.div<{ flip?: boolean }>`
    display: flex;
    flex: 1;
    align-items: center;
    margin: 0 50px;
    z-index: 1;
    position: relative;

    &:after {
        position: absolute;
        width: 70%;
        height: 100%;
        content: '';
        top: 0;
        z-index: -1;
    }

    &:before {
        position: absolute;
        width: 100%;
        height: 100%;
        content: '';
        left: 0;
        top: 0;
        z-index: -1;
    }

    ${props =>
        props.flip === false &&
        `
            &:after {
                right: -70%;
                background: linear-gradient(to left, ${LIGHT_GREY_TRANSPARENT} 0%, ${LIGHT_GREY} 100%);
            }

            &:before {
                left: 0;
                background: ${LIGHT_GREY};
                z-index: -1;
            }
        `}

    ${props =>
        props.flip === true &&
        `
            &:after {
                left: -70%;
                background: linear-gradient(to right, ${LIGHT_GREY_TRANSPARENT} 0%, ${LIGHT_GREY} 100%);
            }

            &:before {
                right: 0;
                background: ${LIGHT_GREY};
            }
        `}

    @media only screen and (min-width: ${variables.SCREEN_SIZE.XL}) {
        &:before {
            display: none;
        }
        &:after {
            display: none;
        }
    }

    @media only screen and (min-width: ${variables.SCREEN_SIZE.MD}) {
        max-width: 50%;
        ${props =>
            props.flip === false &&
            `
            max-width: 40%;
        `}
        margin-left: 100px;
        white-space: pre-wrap;
    }
`;

const FeatureImage = styled.div<Partial<Props>>`
    position: absolute;
    background: url(${props => props.image}) no-repeat;
    width: 100%;
    height: 100%;
    display: none;
    background-size: ${props => props.backgroundSize};

    @media only screen and (min-width: ${variables.SCREEN_SIZE.MD}) {
        display: block;
        background-position: ${props =>
            props.backgroundPosition !== undefined
                ? props.backgroundPosition
                : `center ${props.flip === true ? 'left' : 'right'} 32px`};
    }
`;

interface Props {
    children: ReactNode;
    flip?: boolean;
    backgroundPosition?: string;
    backgroundSize: string;
    image: string;
}

const Index = ({ children, flip, image, backgroundPosition, backgroundSize }: Props) => (
    <Feature flip={flip}>
        <StyledText flip={flip}>
            <Fade duration={0.5} direction="IN">
                {children}
            </Fade>
        </StyledText>
        <FeatureImage
            image={image}
            flip={flip}
            backgroundPosition={backgroundPosition}
            backgroundSize={backgroundSize}
        />
    </Feature>
);

export default Index;

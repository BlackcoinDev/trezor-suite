import React from 'react';
import { LineGraph, GraphPoint } from 'react-native-graph';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box } from '@suite-native/atoms';

type GraphProps = {
    points: GraphPoint[];
};

const graphWrapperStyle = prepareNativeStyle(_ => ({
    width: '100%',
    height: 150,
    marginVertical: 40,
}));

const graphStyle = prepareNativeStyle(_ => ({
    alignSelf: 'center',
    aspectRatio: 21 / 9,
}));

export const Graph = ({ points = [] }: GraphProps) => {
    const { applyStyle } = useNativeStyles();

    const graphPoints = points.length
        ? points
        : [
              {
                  date: new Date(0),
                  value: 0,
              },
          ];

    return (
        <Box style={applyStyle(graphWrapperStyle)}>
            <LineGraph
                style={applyStyle(graphStyle)}
                points={graphPoints}
                color="#00854D"
                animated
                enablePanGesture
            />
        </Box>
    );
};

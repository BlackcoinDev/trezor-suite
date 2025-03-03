import { createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { LineGraphPoint } from './types';
import { getGraphPointsForAccountsThunk } from './graphThunks';

export interface GraphState {
    dashboard: {
        points: LineGraphPoint[];
    };
    account: {
        points: LineGraphPoint[];
    };
}

export const graphInitialState: GraphState = {
    dashboard: {
        points: [],
    },
    account: {
        points: [],
    },
};

export type GraphRootState = {
    wallet: {
        graph: GraphState;
    };
};

const updateSectionPoints = (
    state: GraphState,
    payload: {
        section: 'dashboard' | 'account';
        points: LineGraphPoint[];
    },
) => {
    const { section, points } = payload;
    /**
     * react-native-graph library has problems with rendering path when there are some invalid values.
     * Also graph is not showing (with props animated=true) when dates do not follow each other by milliseconds.
     */
    const validGraphPoints = points
        .filter(point => !Number.isNaN(point.value))
        .map((point, index) => ({
            ...point,
            date: new Date(index),
        }));
    state[section].points = validGraphPoints;
};

export const prepareGraphReducer = createReducerWithExtraDeps(graphInitialState, builder => {
    builder.addCase(getGraphPointsForAccountsThunk.fulfilled, (state, action) => {
        updateSectionPoints(state, action.payload);
    });
});

export const selectDashboardGraphPoints = (state: GraphRootState) =>
    state.wallet.graph.dashboard.points;

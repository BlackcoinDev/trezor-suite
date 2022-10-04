import { analytics, EventType, getRandomId } from '@trezor/connect-analytics';
import { storage } from '@trezor/connect-common';

const saveTrackingEnablement = (enablement: boolean) => {
    storage.save((state, setState) => {
        setState({
            ...state,
            [storage.TRACKING_ENABLED]: enablement,
        });
    });
};

const saveTrackingId = (trackingId: string) => {
    storage.save((state, setState) => {
        setState({
            ...state,
            [storage.TRACKING_ID]: trackingId,
        });
    });
};

const onEnable = () => {
    saveTrackingEnablement(true);
    analytics.report({ type: EventType.SettingsTracking, value: true });
};

const onDisable = () => {
    saveTrackingEnablement(false);
    analytics.report({ type: EventType.SettingsTracking, value: false }, true);
};

export const initAnalytics = () => {
    let trackingId = storage.load()[storage.TRACKING_ID];
    if (!trackingId) {
        trackingId = getRandomId();
        saveTrackingId(trackingId);
    }

    const userAllowedTracking = storage.load()[storage.TRACKING_ENABLED];

    analytics.init(userAllowedTracking || false, {
        instanceId: trackingId,
        environment: 'web',
        commitId: process.env.COMMIT_HASH || '',
        isDev: process.env.NODE_ENV === 'development',
        callbacks: {
            onEnable,
            onDisable,
        },
    });
};

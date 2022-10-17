import { onCancel as closeModal, openModal } from '@suite-actions/modalActions';
import { CoinjoinSession, RoundPhase } from '@suite-common/wallet-types';
import { TrezorDevice } from '@suite-types/index';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useInterval } from 'react-use';

const CRITICAL_PHASES = [
    RoundPhase.ConnectionConfirmation,
    RoundPhase.OutputRegistration,
    RoundPhase.TransactionSigning,
];

export const useCoinjoinTracker = (
    accountKey: string,
    session: CoinjoinSession,
    relatedDevice: TrezorDevice | undefined,
) => {
    const [isCriticalPhase, setIsCriticalPhase] = useState(false);
    const [isDeviceLost, setIsDeviceLost] = useState(false);

    const dispatch = useDispatch();

    useInterval(() => {
        const { phase } = session;

        if (phase === undefined) {
            return;
        }

        if (!relatedDevice?.available) {
            if (isCriticalPhase) {
                setIsCriticalPhase(false);
                dispatch(closeModal());
            }

            if (!isDeviceLost) {
                setIsDeviceLost(true);
                dispatch(
                    openModal({
                        type: 'reconnect-coinjoin-device',
                        relatedDeviceState: relatedDevice?.state || '',
                    }),
                );
            }

            return;
        }

        if (relatedDevice?.available && isDeviceLost) {
            setIsDeviceLost(false);
            dispatch(closeModal());
        }

        if (CRITICAL_PHASES.includes(phase) && !isCriticalPhase) {
            setIsCriticalPhase(true);
            dispatch(openModal({ type: 'critical-coinjoin-phase', relatedAccountKey: accountKey }));
        } else if (!CRITICAL_PHASES.includes(phase) && isCriticalPhase) {
            setIsCriticalPhase(false);
            dispatch(closeModal());
        }
    }, 5000);
};

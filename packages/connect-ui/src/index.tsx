import React, { useEffect, useState } from 'react';

import { createUiResponse, POPUP, PopupInit, UI } from '@trezor/connect';

// views
import { Transport, TransportEventProps } from './views/Transport';
import { Passphrase, PassphraseEventProps } from './views/Passphrase';
import { ErrorView, ErrorViewProps } from './views/Error';
import { ThemeWrapper } from './support/ThemeWrapper';
import { IntlWrapper } from './support/IntlWrapper';
import { ErrorBoundary } from './support/ErrorBoundary';
import { GlobalStyle } from './support/GlobalStyle';
import { AnalyticsConsentWrapper } from './components/AnalyticsConsentWrapper';

export type ConnectUIProps =
    | TransportEventProps
    | PassphraseEventProps
    | ErrorViewProps
    | PopupInit;

export const ConnectUI = (props?: ConnectUIProps) => {
    const [view, setView] = useState<ConnectUIProps | undefined>(undefined);

    const [initInfo, setInitInfo] = useState<PopupInit | undefined>(undefined);

    useEffect(() => {
        const listener = (e: Event) => {
            const detail = (e as CustomEvent).detail as ConnectUIProps;

            if (detail.type === POPUP.INIT) {
                setInitInfo(detail);
                return;
            }

            setView(detail);
        };

        document.addEventListener('react', listener);

        return document.removeEventListener('react', listener);
    }, []);

    const getComponent = () => {
        if (!view) return null;

        switch (view.type) {
            case UI.TRANSPORT:
                return <Transport />;
            case UI.REQUEST_PASSPHRASE:
                return (
                    <Passphrase
                        {...view}
                        onPassphraseSubmit={(value: string, passphraseOnDevice?: boolean) => {
                            postMessage(
                                createUiResponse(UI.RECEIVE_PASSPHRASE, {
                                    value,
                                    passphraseOnDevice,
                                    // todo: what is this param?
                                    save: true,
                                }),
                            );
                        }}
                    />
                );
            case 'error':
                return <ErrorView {...view} />;
            default:
                // @ts-expect-error
                throw new Error(`no such view exists: ${props.type}`);
        }
    };

    return (
        <ErrorBoundary>
            <GlobalStyle />
            <ThemeWrapper>
                {/* todo: load translations from somewhere and pass them to intl */}
                <IntlWrapper>
                    {getComponent()}
                    <AnalyticsConsentWrapper initInfo={initInfo} />
                </IntlWrapper>
            </ThemeWrapper>
        </ErrorBoundary>
    );
};

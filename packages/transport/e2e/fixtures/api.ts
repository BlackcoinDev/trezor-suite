// @ts-nocheck
import { Transport } from '../../src';

type Fixture<Method extends (...args: any) => any> = {
    description: string;
    in: Parameters<Method>;
    out: {
        bridge: Awaited<ReturnType<Method>>;
        nodeusb: Awaited<ReturnType<Method>>;
    };
};

const enumerate: Fixture<Transport['enumerate']>[] = [
    {
        description: 'my connected device',
        in: [],
        out: {
            // @ts-expect-error
            BridgeTransport: [{ path: '1', product: 21441, session: null, vendor: 4617 }],
            NodeUsbTransport: [{ path: '0A798C90E3EBD2ACE9739607' }],
        },
    },
];

const call: Fixture<Transport['call']>[] = [
    {
        description: 'my connected device',
        in: [{ session: '1', name: 'GetFeatures', data: {} }],
        out: {
            // @ts-expect-error
            BridgeTransport: [{ path: '1', product: 21441, session: null, vendor: 4617 }],
            NodeUsbTransport: [{ path: '0A798C90E3EBD2ACE9739607' }],
        },
    },
];

export const fixtures = {
    // enumerate,
    call,
};

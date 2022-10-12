// !!!!! dont forget testEnvironment: node otherwise it returns weird results
// todo resolve ts

import fetch from 'node-fetch';
import { BridgeTransport, setFetch } from '../../lib';
import { NodeUsbTransport } from '../../lib/transports/nodeusb';

import * as messages from '../../messages.json';

import { fixtures } from '../fixtures/api';

setFetch(fetch, true);

describe(NodeUsbTransport.name, () => {
    const Transport = NodeUsbTransport;
    Object.keys(fixtures).forEach(method => {
        // @ts-ignore
        fixtures[method].forEach(f => {
            test(`${method}: ${f.description}`, async () => {
                const transport = new Transport({
                    messages,
                });
                await transport.init();

                // @ts-ignore
                const result = await transport[method](...f.in);
                expect(result).toEqual(f.out[Transport.name]);
            });
        });
    });
});

describe(BridgeTransport.name, () => {
    const Transport = BridgeTransport;
    Object.keys(fixtures).forEach(method => {
        // @ts-ignore
        fixtures[method].forEach(f => {
            test(`${method}: ${f.description}`, async () => {
                const transport = new Transport({
                    messages,
                });
                await transport.init();

                // @ts-ignore
                const result = await transport[method](...f.in);
                expect(result).toEqual(f.out[Transport.name]);
            });
        });
    });
});

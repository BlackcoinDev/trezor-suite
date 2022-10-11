// !!!!! dont forget testEnvironment: node otherwise it returns weird results
// todo resolve ts
// @ts-nocheck

import fetch from 'node-fetch';
import { NodeUsbTransport, BridgeTransport, setFetch } from '../../lib';
import * as messages from '../../messages.json';

import { fixtures } from '../fixtures/api';

setFetch(fetch, true);

const transports = [NodeUsbTransport, BridgeTransport];

transports.forEach(Transport => {
    describe(Transport.name, () => {
        Object.keys(fixtures).forEach(method => {
            fixtures[method].forEach(f => {
                test(f.description, async () => {
                    const transport = new Transport({ messages });
                    await transport.init();

                    const result = await transport[method](f.in);
                    expect(result).toMatchObject(f.out);
                });
            });
        });
    });
});

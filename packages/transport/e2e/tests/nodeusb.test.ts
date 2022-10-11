// !!!!! dont forget testEnvironment: node otherwise it returns weird results
// todo resolve ts
// @ts-nocheck

import { NodeUsbTransport } from '../../lib';
import * as messages from '../../messages.json';

import { fixtures } from '../fixtures/api';

describe('nodeusb', () => {
    Object.keys(fixtures).forEach(method => {
        fixtures[method].forEach(f => {
            test(f.description, async () => {
                const transport = new NodeUsbTransport({ messages });
                await transport.init();

                const result = await transport[method](f.in);
                expect(result).toMatchObject(f.out);
            });
        });
    });
});

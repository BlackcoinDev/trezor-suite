// @ts-nocheck

import fetch from 'node-fetch';
// import { Transport } from 'packages/transport/src';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

// testing build. yarn workspace @trezor/transport build:lib is a required step therefore
import { BridgeTransport, setFetch } from '../../lib';
import { NodeUsbTransport } from '../../lib/transports/nodeusb';

import * as messages from '../../messages.json';

jest.setTimeout(60000);

const mnemonicAll = 'all all all all all all all all all all all all';

const emulatorSetupOpts = {
    mnemonic: mnemonicAll,
    pin: '',
    passphrase_protection: false,
    label: 'TrezorT',
    needs_backup: true,
};

const emulatorStartOpts = { version: '2-master', wipe: true };

const enumerate = {
    BridgeTransport: [
        {
            path: '1',
            session: null,
            product: 0,
            vendor: 0,
        },
    ],
    NodeUsbTransport: [{ path: '0A798C90E3EBD2ACE9739607' }],
};

describe('api tests', () => {
    beforeAll(async () => {
        // await TrezorUserEnvLink.connect();
    });

    afterAll(() => {
        // TrezorUserEnvLink.api.stopEmu();
        // TrezorUserEnvLink.disconnect();
    });

    test.each[(NodeUsbTransport, BridgeTransport)]('%s: test', () => {
        let devices: any[];
        let session: any;
        let transport: Transport;
        beforeEach(async () => {
            // await TrezorUserEnvLink.send({ type: 'bridge-stop' });
            // await TrezorUserEnvLink.send({ type: 'emulator-start', ...emulatorStartOpts });
            // await TrezorUserEnvLink.send({ type: 'emulator-setup', ...emulatorSetupOpts });
            // await TrezorUserEnvLink.send({ type: 'bridge-start' });

            setFetch(fetch, true);

            // @ts-ignore
            transport = new Transport({ messages: messages });

            await transport.init();

            devices = await transport.enumerate();

            // @ts-ignore
            expect(devices).toEqual(enumerate[Transport.name]);

            session = await transport.acquire({ input: { path: devices[0].path } });
        });

        test(`Call(GetFeatures)`, async () => {
            const message = await transport.call({ session, name: 'GetFeatures', data: {} });
            expect(message).toMatchObject({
                type: 'Features',
                message: {
                    vendor: 'trezor.io',
                },
            });
        });

        // test(`send(GetFeatures) - receive`, async () => {
        //     const sendResponse = await bridge.send({ session, name: 'GetFeatures', data: {} });
        //     expect(sendResponse).toEqual(undefined);

        //     const receiveResponse = await bridge.receive({ session });
        //     expect(receiveResponse).toMatchObject({
        //         type: 'Features',
        //         message: {
        //             vendor: 'trezor.io',
        //             label: 'TrezorT',
        //         },
        //     });
        // });

        // test(`call(ChangePin) - send(Cancel) - receive`, async () => {
        //     // initiate change pin procedure on device
        //     const callResponse = await bridge.call({ session, name: 'ChangePin', data: {} });
        //     expect(callResponse).toMatchObject({
        //         type: 'ButtonRequest',
        //     });

        //     // cancel change pin procedure
        //     const sendResponse = await bridge.send({ session, name: 'Cancel', data: {} });
        //     expect(sendResponse).toEqual(undefined);

        //     // receive response
        //     const receiveResponse = await bridge.receive({ session });
        //     expect(receiveResponse).toMatchObject({
        //         type: 'Failure',
        //         message: {
        //             code: 'Failure_ActionCancelled',
        //             message: 'Cancelled',
        //         },
        //     });

        //     // validate that we can continue with communication
        //     const message = await bridge.call({
        //         session,
        //         name: 'GetFeatures',
        //         data: {},
        //     });
        //     expect(message).toMatchObject({
        //         type: 'Features',
        //         message: {
        //             vendor: 'trezor.io',
        //             label: 'TrezorT',
        //         },
        //     });
        // });

        // test(`call(Backup) - send(Cancel) - receive`, async () => {
        //     // initiate change pin procedure on device
        //     const callResponse = await bridge.call({ session, name: 'BackupDevice', data: {} });
        //     expect(callResponse).toMatchObject({
        //         type: 'ButtonRequest',
        //     });

        //     // cancel change pin procedure
        //     const sendResponse = await bridge.send({ session, name: 'Cancel', data: {} });
        //     expect(sendResponse).toEqual(undefined);

        //     // receive response
        //     const receiveResponse = await bridge.receive({ session });
        //     expect(receiveResponse).toMatchObject({
        //         type: 'Failure',
        //         message: {
        //             code: 'Failure_ActionCancelled',
        //             message: 'Cancelled',
        //         },
        //     });

        //     // validate that we can continue with communication
        //     const message = await bridge.call({ session, name: 'GetFeatures', data: {} });
        //     expect(message).toMatchObject({
        //         type: 'Features',
        //         message: {
        //             vendor: 'trezor.io',
        //             label: 'TrezorT',
        //         },
        //     });
        // });
    });
});

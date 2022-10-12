import fetch from 'node-fetch';

// testing build. yarn workspace @trezor/transport build:lib is a required step therefore
import { BridgeTransport, setFetch } from '../../lib';
import messages from '../../messages.json';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

// todo: introduce global jest config for e2e
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

describe('bridge', () => {
    beforeAll(async () => {
        await TrezorUserEnvLink.connect();
    });

    afterAll(() => {
        TrezorUserEnvLink.disconnect();
    });

    // there might be more versions of bridge out there, see https://github.com/trezor/webwallet-data/tree/master/bridge
    // but they are not available from trezor-user-env, see https://github.com/trezor/trezor-user-env/tree/master/src/binaries/trezord-go/bin
    ['2.0.26', '2.0.27', undefined].forEach(bridgeVersion => {
        describe(bridgeVersion || 'latest', () => {
            let bridge: any;
            let devices: any[];
            let session: any;
            beforeEach(async () => {
                await TrezorUserEnvLink.send({ type: 'bridge-stop' });
                await TrezorUserEnvLink.send({ type: 'emulator-start', ...emulatorStartOpts });
                await TrezorUserEnvLink.send({ type: 'emulator-setup', ...emulatorSetupOpts });
                await TrezorUserEnvLink.send({ type: 'bridge-start', version: bridgeVersion });

                setFetch(fetch, true);

                // @ts-ignore
                bridge = new BridgeTransport({ messages: messages.nested });

                await bridge.init();

                devices = await bridge.enumerate();

                expect(devices).toEqual([
                    {
                        path: '1',
                        session: null,
                        product: 0,
                        vendor: 0,
                    },
                ]);

                session = await bridge.acquire({ input: { path: devices[0].path } });
            });

            test(`Call(GetFeatures)`, async () => {
                const message = await bridge.call({ session, name: 'GetFeatures', data: {} });
                expect(message).toMatchObject({
                    type: 'Features',
                    message: {
                        vendor: 'trezor.io',
                        label: 'TrezorT',
                    },
                });
            });

            test(`send(GetFeatures) - receive`, async () => {
                const sendResponse = await bridge.send({ session, name: 'GetFeatures', data: {} });
                expect(sendResponse).toEqual(undefined);

                const receiveResponse = await bridge.receive({ session });
                expect(receiveResponse).toMatchObject({
                    type: 'Features',
                    message: {
                        vendor: 'trezor.io',
                        label: 'TrezorT',
                    },
                });
            });

            test(`call(ChangePin) - send(Cancel) - receive`, async () => {
                // initiate change pin procedure on device
                const callResponse = await bridge.call({ session, name: 'ChangePin', data: {} });
                expect(callResponse).toMatchObject({
                    type: 'ButtonRequest',
                });

                // cancel change pin procedure
                const sendResponse = await bridge.send({ session, name: 'Cancel', data: {} });
                expect(sendResponse).toEqual(undefined);

                // receive response
                const receiveResponse = await bridge.receive({ session });
                expect(receiveResponse).toMatchObject({
                    type: 'Failure',
                    message: {
                        code: 'Failure_ActionCancelled',
                        message: 'Cancelled',
                    },
                });

                // validate that we can continue with communication
                const message = await bridge.call({
                    session,
                    name: 'GetFeatures',
                    data: {},
                });
                expect(message).toMatchObject({
                    type: 'Features',
                    message: {
                        vendor: 'trezor.io',
                        label: 'TrezorT',
                    },
                });
            });

            test(`call(Backup) - send(Cancel) - receive`, async () => {
                // initiate change pin procedure on device
                const callResponse = await bridge.call({ session, name: 'BackupDevice', data: {} });
                expect(callResponse).toMatchObject({
                    type: 'ButtonRequest',
                });

                // cancel change pin procedure
                const sendResponse = await bridge.send({ session, name: 'Cancel', data: {} });
                expect(sendResponse).toEqual(undefined);

                // receive response
                const receiveResponse = await bridge.receive({ session });
                expect(receiveResponse).toMatchObject({
                    type: 'Failure',
                    message: {
                        code: 'Failure_ActionCancelled',
                        message: 'Cancelled',
                    },
                });

                // validate that we can continue with communication
                const message = await bridge.call({ session, name: 'GetFeatures', data: {} });
                expect(message).toMatchObject({
                    type: 'Features',
                    message: {
                        vendor: 'trezor.io',
                        label: 'TrezorT',
                    },
                });
            });
        });
    });
});

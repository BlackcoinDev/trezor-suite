import { NodeUsbTransport } from '../../lib/transports/nodeusb';
import messages from '../../messages.json';

// todo: introduce global jest config for e2e
jest.setTimeout(60000);

describe('nodeusb', () => {
    beforeAll(async () => {});

    afterAll(() => {});

    let transport: any;
    let devices: any[];
    let session: any;
    beforeEach(async () => {
        // @ts-ignore
        transport = new NodeUsbTransport({ messages: messages });

        await transport.init();

        devices = await transport.enumerate();

        expect(devices).toEqual([
            {
                // TODO: different from bridge!!!
                path: '0A798C90E3EBD2ACE9739607',
            },
        ]);

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

    test(`send(GetFeatures) - receive`, async () => {
        const sendResponse = await transport.send({ session, name: 'GetFeatures', data: {} });
        expect(sendResponse).toEqual(undefined);

        const receiveResponse = await transport.receive({ session });
        expect(receiveResponse).toMatchObject({
            type: 'Features',
            message: {
                vendor: 'trezor.io',
            },
        });
    });

    test(`call(ChangePin) - send(Cancel) - receive`, async () => {
        // initiate change pin procedure on device
        const callResponse = await transport.call({ session, name: 'ChangePin', data: {} });
        expect(callResponse).toMatchObject({
            type: 'ButtonRequest',
        });

        // cancel change pin procedure
        const sendResponse = await transport.send({ session, name: 'Cancel', data: {} });
        expect(sendResponse).toEqual(undefined);

        // receive response
        const receiveResponse = await transport.receive({ session });
        expect(receiveResponse).toMatchObject({
            type: 'Failure',
            message: {
                code: 'Failure_ActionCancelled',
                // TODO: different message than in bridge!!!!
                // message: 'Cancelled',
                message: 'Action cancelled by user',
            },
        });

        // validate that we can continue with communication
        const message = await transport.call({
            session,
            name: 'GetFeatures',
            data: {},
        });
        expect(message).toMatchObject({
            type: 'Features',
            message: {
                vendor: 'trezor.io',
            },
        });
    });
});

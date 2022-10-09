import { request as http } from '../utils/http';
import * as check from '../utils/highlevel-checks';
import { buildOne } from '../lowlevel/send';
import { receiveOne } from '../lowlevel/receive';
import { DEFAULT_URL } from '../constants';
import { Transport } from './abstract';

import type { AcquireInput, TrezorDeviceInfoWithSession } from '../types';

const resolveAfter = (msec: number, value?: any) =>
    new Promise<any>(resolve => {
        setTimeout(resolve, msec, value);
    });

type IncompleteRequestOptions = {
    body?: Array<any> | Record<string, unknown> | string;
    url: string;
};

export class BridgeTransport extends Transport {
    bridgeVersion?: string;
    name = 'BridgeTransport';
    url: string;
    priority = 1;

    constructor({
        url = DEFAULT_URL,
        messages,
    }: ConstructorParameters<typeof Transport>[0] & { url?: string }) {
        super({ messages });
        this.url = url;
    }

    async init() {
        try {
            const infoS = await http({
                url: this.url,
                method: 'POST',
            });
            const info = check.info(infoS);
            this.version = info.version;
        } catch (err) {
            throw new Error('bridge is not running');
        }

        // const newVersion =
        //     typeof this.bridgeVersion === 'string'
        //         ? this.bridgeVersion
        //         : check.version(
        //               await http({
        //                   url: `${this.newestVersionUrl}?${Date.now()}`,
        //                   method: 'GET',
        //               }),
        //           );
        // this.isOutdated = versionUtils.isNewer(newVersion, this.version);
        // this.emit('transport-start');
    }

    // todo:
    // - listen should not throw on expected timeout, this case should be handled
    // inside listen method and next call to listen should be made. now, this is done
    // Device descriptor, but this is wrong, this throw should be expected and as that
    // it should be handled directly here.
    // @ts-ignore
    async listen(): Promise<TrezorDeviceInfoWithSession[]> {
        console.log('transport: bridge: listen, super.descriptors', this.descriptors);

        const listenTimestamp = new Date().getTime();

        try {
            const devicesS = await this._post({
                url: '/listen',
                body: this.descriptors.map(o => ({
                    ...o,
                    //  debug: true,
                    //   debugSession: null
                })),
            });
            const devices = check.devices(devicesS);

            this._onListenResult(devices);
            return this.listen();
        } catch (err) {
            console.log('transport: bridge: listen: err', err);

            // todo:
            // distinguish errors maybe?

            const time = new Date().getTime() - listenTimestamp;

            if (time > 1100) {
                await resolveAfter(1000, null);
                return this.listen();
            } else {
                this.emit('transport-error', err);
            }
        }
    }

    async enumerate() {
        const devicesS = await this._post({ url: '/enumerate' });
        const devices = check.devices(devicesS);
        return devices;
    }

    async acquire({ input }: { input: AcquireInput }) {
        console.log('transport: bridge: acquire: input', input);
        const previousStr = input.previous == null ? 'null' : input.previous;
        const url = `/acquire/${input.path}/${previousStr}`;
        const acquireS = await this._post({ url });
        console.log('transport: bridge: acquire acquireS', acquireS);

        return check.acquire(acquireS);
    }

    async release(session: string, onclose: boolean) {
        const res = this._post({
            url: `/release/${session}`,
        });
        if (onclose) {
            return;
        }
        await res;
    }

    async call({
        session,
        name,
        data,
    }: {
        session: string;
        name: string;
        data: Record<string, unknown>;
    }) {
        const { messages } = this;
        const o = buildOne(messages, name, data);
        const outData = o.toString('hex');
        const resData = await this._post({
            url: `/call/${session}`,
            body: outData,
        });
        if (typeof resData !== 'string') {
            throw new Error('Returning data is not string.');
        }
        const jsonData = receiveOne(messages, resData);
        return check.call(jsonData);
    }

    async send({
        session,
        name,
        data,
    }: {
        session: string;
        data: Record<string, unknown>;
        name: string;
    }) {
        const { messages } = this;
        const outData = buildOne(messages, name, data).toString('hex');
        await this._post({
            url: `/post/${session}`,
            body: outData,
        });
    }

    async receive({ session }: { session: string }) {
        const { messages } = this;
        const resData = await this._post({
            url: `/read/${session}`,
        });
        if (typeof resData !== 'string') {
            throw new Error('Returning data is not string.');
        }
        const jsonData = receiveOne(messages, resData);
        return check.call(jsonData);
    }

    /**
     * All bridge endpoints use POST methods
     * For documentation, look here: https://github.com/trezor/trezord-go#api-documentation
     */
    _post(options: IncompleteRequestOptions) {
        return http({
            ...options,
            method: 'POST',
            url: this.url + options.url,
            skipContentTypeHeader: true,
        });
    }
}

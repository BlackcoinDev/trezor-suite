import { request as http } from '../utils/http';
import * as check from '../utils/highlevel-checks';
import { buildOne } from '../lowlevel/send';
import { receiveOne } from '../lowlevel/receive';
import { DEFAULT_URL } from '../constants';
import { Transport } from './abstract';

import type { AcquireInput, TrezorDeviceInfoWithSession } from '../types';

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
        await this._silentInit();
    }

    async _silentInit() {
        const infoS = await http({
            url: this.url,
            method: 'POST',
        });
        const info = check.info(infoS);
        this.version = info.version;
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
    }

    async listen(old?: Array<TrezorDeviceInfoWithSession>) {
        if (old == null) {
            throw new Error('Bridge v2 does not support listen without previous.');
        }
        const devicesS = await this._post({
            url: '/listen',
            body: old.map(o => ({ ...o, debug: true, debugSession: null })),
        });
        const devices = check.devices(devicesS);
        return devices;
    }

    async enumerate() {
        const devicesS = await this._post({ url: '/enumerate' });
        const devices = check.devices(devicesS);
        return devices;
    }

    async acquire({ input }: { input: AcquireInput }) {
        const acquireS = await this._acquireMixed(input);
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

    _post(options: IncompleteRequestOptions) {
        return http({
            ...options,
            method: 'POST',
            url: this.url + options.url,
            skipContentTypeHeader: true,
        });
    }

    _acquireMixed(input: AcquireInput) {
        const previousStr = input.previous == null ? 'null' : input.previous;
        const url = `/acquire/${input.path}/${previousStr}`;
        return this._post({ url });
    }
}

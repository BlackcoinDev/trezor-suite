// @ts-nocheck
/// <reference types="w3c-web-usb" />

import { EventEmitter } from 'events';
import { Transport } from './abstract';
import { buildBuffers } from '../lowlevel/send';
import { receiveAndParse } from '../lowlevel/receive';

import { AcquireInput, MessageFromTrezor } from '../types';
import {
    CONFIGURATION_ID,
    ENDPOINT_ID,
    INTERFACE_ID,
    T1HID_VENDOR,
    TREZOR_DESCS,
} from '../constants';

import { WebUSB } from 'usb';

type UsbTransportConstructorParams = ConstructorParameters<typeof Transport>[0] & {
    usbInterface: any; // this.usbInterface | nodeusb
};

export class UsbTransport extends Transport {
    name = 'WebusbTransport';
    requestNeeded = true;
    unreadableHidDevice = false;
    unreadableHidDeviceChange = new EventEmitter();
    priority = 0;
    usbInterface: UsbTransportConstructorParams['usbInterface'];

    constructor({ messages, usbInterface }: UsbTransportConstructorParams) {
        super({ messages });
        this.usbInterface = usbInterface;
    }

    init() {
        console.log('transport. webusb. init');
        if (!this.usbInterface) {
            throw new Error('WebUSB is not available on this browser.');
        }

        this.emit('transport-start');

        return Promise.resolve(); // type compatibility
    }

    listen() {
        console.log('transport: webusb: listen');
        const onConnect = async (_event: USBConnectionEvent) => {
            // this._listDevices();
            const devices = await this._listDevices();

            this._onListenResult(devices);
        };

        console.log('this.usbInterface', this.usbInterface);
        this.usbInterface.onconnect = onConnect;

        return Promise.resolve([]);
        // return this.enumerate();
    }

    async enumerate() {
        // console.log('transport: webusb: enumerate');
        const result = await this._listDevices();
        return result.map(info => ({
            path: info.path,
        }));

        // const customWebUSB = new WebUSB({
        //     // Bypass cheking for authorised devices
        //     allowAllDevices: true,
        // });

        // // Uses blocking calls, so is async
        // const allDevices = await customWebUSB.getDevices();
        // const devices = allDevices.filter(
        //     (device: any) => device.vendorId === 4617 && device.productId === 21441,
        // );

        // console.log('devices', devices);

        // return devices;
    }

    _deviceIsHid(device: USBDevice) {
        return device.vendorId === T1HID_VENDOR;
    }

    _filterDevices(devices: any[]) {
        const trezorDevices = devices.filter(dev => {
            const isTrezor = TREZOR_DESCS.some(
                desc => dev.vendorId === desc.vendorId && dev.productId === desc.productId,
            );
            return isTrezor;
        });
        const hidDevices = trezorDevices.filter(dev => this._deviceIsHid(dev));
        const nonHidDevices = trezorDevices.filter(dev => !this._deviceIsHid(dev));
        return [hidDevices, nonHidDevices];
    }

    _createDevices(nonHidDevices: any[]) {
        let bootloaderId = 0;

        return nonHidDevices.map(device => {
            // path is just serial number
            // more bootloaders => number them, hope for the best
            const { serialNumber } = device;
            let path = serialNumber == null || serialNumber === '' ? 'bootloader' : serialNumber;
            if (path === 'bootloader') {
                bootloaderId++;
                path += bootloaderId;
            }
            return { path, device };
        });
    }

    async _listDevices() {
        const devices = await this.usbInterface.getDevices();
        // this._lastDevices = nonHidDevices.map(device => {
        //     // path is just serial number
        //     // more bootloaders => number them, hope for the best
        //     const { serialNumber } = device;
        //     let path = serialNumber == null || serialNumber === '' ? 'bootloader' : serialNumber;
        //     if (path === 'bootloader') {
        //         bootloaderId++;
        //         path += bootloaderId;
        //     }
        //     const debug = this._deviceHasDebugLink(device);
        //     return { path, device, debug };
        // });

        const [hidDevices, nonHidDevices] = this._filterDevices(devices);
        this._lastDevices = this._createDevices(nonHidDevices);

        const oldUnreadableHidDevice = this.unreadableHidDevice;
        this.unreadableHidDevice = hidDevices.length > 0;

        if (oldUnreadableHidDevice !== this.unreadableHidDevice) {
            this.unreadableHidDeviceChange.emit('change');
        }

        return this._lastDevices;
    }

    _lastDevices: { path: string; device: USBDevice }[] = [];

    _findDevice(_path: string) {
        // const deviceO = this._lastDevices.find(d => d.path === path);
        const deviceO = this._lastDevices[0];
        if (deviceO == null) {
            throw new Error('Action was interrupted.');
        }
        return deviceO.device;
    }

    async call({
        session,
        name,
        path = this._lastDevices[0]?.path || '',
        data,
    }: {
        session: string;
        path: string;
        name: string;
        data: Record<string, unknown>;
    }): Promise<MessageFromTrezor> {
        console.log('webusb transport call. session', session);
        console.log('webusb transport call. name', name);
        console.log('webusb transport call. path', path);
        console.log('webusb transport call. data', data);

        await this.send({ name, path, data, session });
        return this.receive({ path });
    }

    async send({
        path,
        data,
        // session,
        name,
    }: {
        path: string;
        data: Record<string, unknown>;
        session: string;
        name: string;
    }) {
        const device: USBDevice = this._findDevice(path);

        const buffers = buildBuffers(this.messages!, name, data);
        for (const buffer of buffers) {
            const newArray: Uint8Array = new Uint8Array(64);
            newArray[0] = 63;
            newArray.set(new Uint8Array(buffer), 1);

            if (!device.opened) {
                await this.acquire({ input: { path } });
            }

            const endpoint = ENDPOINT_ID;
            device.transferOut(endpoint, newArray);
        }
    }

    async receive({ path }: { path: string }) {
        console.log('transport: webusb receive, path', path);
        const message: MessageFromTrezor = await receiveAndParse(this.messages!, () =>
            this._read(path),
        );
        console.log('transport receive, message', message);

        return message;
    }

    async _read(path: string): Promise<ArrayBuffer> {
        const device = this._findDevice(path);
        const endpoint = ENDPOINT_ID;

        try {
            if (!device.opened) {
                await this.acquire({ input: { path } });
            }

            const res = await device.transferIn(endpoint, 64);

            if (!res.data) {
                throw new Error('no data');
            }
            if (res.data.byteLength === 0) {
                return this._read(path);
            }
            return res.data.buffer.slice(1);
        } catch (e) {
            if (e.message === 'Device unavailable.') {
                throw new Error('Action was interrupted.');
            } else {
                throw e;
            }
        }
    }

    //
    async acquire({ input, first = false }: { input: AcquireInput; first?: boolean }) {
        console.log('transport: webusb: acquire', input);
        const { path } = input;
        for (let i = 0; i < 5; i++) {
            if (i > 0) {
                await new Promise(resolve => setTimeout(() => resolve(undefined), i * 200));
            }
            try {
                await this._connectIn(path, first);
                return Promise.resolve('null');
            } catch (e) {
                console.log('transport:webusb:acquire: catch', e);
                // ignore
                if (i === 4) {
                    throw e;
                }
            }
        }
        console.log('transport: webusb: should not get here');

        return Promise.resolve('??');
    }

    async _connectIn(path: string, first: boolean) {
        const device: USBDevice = this._findDevice(path);
        await device.open();

        if (first) {
            await device.selectConfiguration(CONFIGURATION_ID);
            try {
                // reset fails on ChromeOS and windows
                await device.reset();
            } catch (error) {
                // do nothing
            }
        }

        const interfaceId = INTERFACE_ID;
        await device.claimInterface(interfaceId);
        console.log('transport:webusb:_connectIn done');
    }

    // todo: params different meaning from bridge
    async release(path: string, last: boolean) {
        const device: USBDevice = await this._findDevice(path);

        const interfaceId = INTERFACE_ID;
        await device.releaseInterface(interfaceId);
        if (last) {
            await device.close();
        }
    }

    // // TODO(karliatto): apparetly we can remove it from here since it is used in:
    // // packages/suite/src/components/suite/WebusbButton/index.tsx
    // async requestDevice() {
    //     // I am throwing away the resulting device, since it appears in enumeration anyway
    //     await this.usb!.requestDevice({ filters: TREZOR_DESCS });
    // }
}

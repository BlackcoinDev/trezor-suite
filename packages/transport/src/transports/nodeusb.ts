// @ts-nocheck

import { Transport } from './abstract';
import { UsbTransport } from './usb';

import { webusb, usb, WebUSB } from 'usb';

export class NodeUsbTransport extends UsbTransport {
    name = 'NodeUsbTransport';

    constructor({ messages }: ConstructorParameters<typeof Transport>[0]) {
        // todo: passUsbInterface for node here

        super({
            messages,
            usbInterface: new WebUSB({
                allowAllDevices: true,
            }),
        });
    }

    // @ts-ignore
    listen() {
        const onConnect = async (_event: USBConnectionEvent) => {
            console.log('=== >< < > > onConnect');
            const devices = await this.usbInterface.getDevices();
            // const devices = await this._listDevices();
            console.log('transport: nodeusb: listen result', devices);

            this._onListenResult(devices);
        };
        // @ts-ignore
        usb.on('attach', onConnect);

        return Promise.resolve([]);
        // return this.enumerate();
    }
}

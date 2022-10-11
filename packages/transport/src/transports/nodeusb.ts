// @ts-nocheck

import { Transport } from './abstract';
import { UsbTransport } from './usb';

import { WebUSB } from 'usb';

// notes:
// to make it work I needed to run `sudo chmod -R 777 /dev/bus/usb/`

export class NodeUsbTransport extends UsbTransport {
    name = 'NodeUsbTransport';

    constructor({ messages }: ConstructorParameters<typeof Transport>[0]) {
        // todo: passUsbInterface for node here

        super({
            messages,
            usbInterface: new WebUSB({
                allowAllDevices: true, // return all devices, not only authorized
            }),
        });
    }
}

import { Transport } from './abstract';
import { UsbTransport } from './usb';

export class WebUsbTransport extends UsbTransport {
    name = 'WebusbTransport';

    constructor({ messages }: ConstructorParameters<typeof Transport>[0]) {
        super({ messages, usbInterface: navigator.usb });
    }
}

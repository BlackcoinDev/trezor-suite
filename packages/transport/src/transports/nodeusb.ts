import { Transport } from './abstract';
import { UsbTransport } from './usb';

export class NodeusbTransport extends UsbTransport {
    constructor({ messages }: ConstructorParameters<typeof Transport>[0]) {
        // todo: passUsbInterface for node here
        super({ messages, usbInterface: navigator.usb });
    }
}

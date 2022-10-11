import { NodeUsbTransport } from '../../lib';
import messages from '../../messages.json';

(async () => {
    let transport = new NodeUsbTransport({ messages });
    transport = new NodeUsbTransport({ messages });
    await transport.init();
    const result = await transport.enumerate();
    console.log('result', result);
})();

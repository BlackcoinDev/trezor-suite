import { Transport } from '../transports/abstract';

// First transport that inits successfully is the final one; others won't even start initiating.
export const getAvailableTransport = async (transports: Transport[]): Promise<Transport> => {
    let lastError: any = null;

    for (const transport of transports) {
        try {
            await transport.init();
            return transport;
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError || new Error('No transport could be initialized.');
};

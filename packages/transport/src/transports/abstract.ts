import * as protobuf from 'protobufjs/light';
import { EventEmitter } from 'events';
import { TrezorDeviceInfoWithSession, AcquireInput, MessageFromTrezor } from '../types';

type ConstructorParams = {
    messages: JSON;
};

export abstract class Transport extends EventEmitter {
    configured = false;
    messages: protobuf.Root;
    name = '';
    version = '';
    abstract priority: number;

    isOutdated = false;

    constructor({ messages }: ConstructorParams) {
        super();
        this.messages = protobuf.Root.fromJSON(messages as protobuf.INamespace);
    }

    /**
     * Tries to initiate transport. Transport might not be available e.g. bridge not running.
     * TODO: return type? should it ever throw?
     */
    abstract init(): Promise<void>;

    /**
     * Setup listeners for device changes (connect, disconnect, change?).
     * What should it do? Will start emitting DEVICE events after this is fired?
     */
    abstract listen(old?: TrezorDeviceInfoWithSession[]): Promise<TrezorDeviceInfoWithSession[]>;

    /**
     * List Trezor devices
     */
    abstract enumerate(): Promise<TrezorDeviceInfoWithSession[]>;

    /**
     * Acquire session
     */
    abstract acquire({ input, first }: { input: AcquireInput; first?: boolean }): Promise<string>;

    /**
     * Release session
     */
    abstract release(session: string, onclose: boolean): Promise<void>;

    /**
     * Encode data and write it to transport layer
     */
    abstract send({
        path,
        session,
        data,
        name,
    }: {
        path?: string;
        session?: string;
        // wrap object and name?
        name: string;
        data: Record<string, unknown>;
    }): Promise<void>;

    /**
     * Only read from transport
     */
    abstract receive({
        path,
        session,
    }: {
        path?: string;
        session?: string;
    }): Promise<MessageFromTrezor>;

    /**
     * send and read after that
     */
    abstract call({
        session,
        name,
        data,
    }: {
        session: string;
        name: string;
        data: Record<string, unknown>;
    }): Promise<MessageFromTrezor>;

    // todo: not sure if needed. probably not
    stop() {
        console.log('abstract: stop transport');
    }

    // watch
    // call
    // read
}

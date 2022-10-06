import * as protobuf from 'protobufjs/light';
import { EventEmitter } from 'events';

// does not have session
export type TrezorDeviceInfo = {
    path: string;
};

export type TrezorDeviceInfoDebug = {
    path: string;
    debug: boolean;
};

export type TrezorDeviceInfoWithSession = TrezorDeviceInfo & {
    session?: string | null;
    debugSession?: string | null;
    debug: boolean;
};

// export type TrezorDeviceInfoWithSession = TrezorDeviceInfo & {
//     session?: string | null;
//     debugSession?: string | null;
//     debug: boolean;
// };

export type AcquireInput = {
    path: string;
    previous?: string;
};

export type MessageFromTrezor = { type: string; message: Record<string, unknown> };

export abstract class Transport extends EventEmitter {
    configured = false;
    messages?: protobuf.Root;
    debug = false;
    name = '';
    version = '';

    isOutdated = false;

    constructor({ debug = false }) {
        super();
        this.debug = debug;
    }

    abstract listen(old?: TrezorDeviceInfoWithSession[]): Promise<TrezorDeviceInfoWithSession[]>;
    abstract enumerate(): Promise<TrezorDeviceInfoWithSession[]>;

    // TODO(karliatto): we want to totally get rid of `listen`, and use instead `enumerate`.
    // TODO(mroz22): maybe we want to have listen. which will register event listeners for usb changes
    // abstract listen(): void;

    abstract acquire({
        input,
        debug,
        first,
    }: {
        input: AcquireInput;
        debug: boolean;
        first?: boolean;
    }): Promise<string>;
    abstract release(session: string, onclose: boolean, debugLink: boolean): Promise<void>;

    // maybe not needed?
    configure(messages: JSON) {
        // @ts-expect-error
        this.messages = protobuf.Root.fromJSON(messages);
        this.configured = true;
    }

    // resolves when the transport can be used; rejects when it cannot
    abstract init(debug?: boolean): Promise<void>;

    /**
     * Encode data and write it to transport layer
     */
    abstract send({
        path,
        session,
        data,
        debug,
        name,
    }: {
        path?: string;
        session?: string;
        debug: boolean;
        // wrap object and name?
        name: string;
        data: Record<string, unknown>;
    }): Promise<void>;

    // only read from transport
    abstract receive({
        path,
        session,
        debug,
    }: {
        path?: string;
        session?: string;
        debug: boolean;
    }): Promise<MessageFromTrezor>;

    // send and read after that
    abstract call({
        session,
        name,
        data,
        debug,
    }: {
        session: string;
        name: string;
        data: Record<string, unknown>;
        debug: boolean;
    }): Promise<MessageFromTrezor>;

    stop() {
        console.log('abstract: stop transport');
    }
    // todo:
    requestDevice() {}
    // abstract stop(): void;

    // watch
    // call
    // read
}

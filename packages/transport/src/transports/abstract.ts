import * as protobuf from 'protobufjs/light';
import { EventEmitter } from 'events';
import {
    TrezorDeviceInfoWithSession,
    AcquireInput,
    MessageFromTrezor,
    TrezorDeviceInfoWithSession as DeviceDescriptor,
} from '../types';

type ConstructorParams = {
    messages: JSON;
};

type Descriptor = { path: string };

type DeviceDescriptorDiff = {
    didUpdate: boolean;
    connected: DeviceDescriptor[];
    disconnected: DeviceDescriptor[];
    changedSessions: DeviceDescriptor[];
    // changedDebugSessions: DeviceDescriptor[];
    acquired: DeviceDescriptor[];
    // debugAcquired: DeviceDescriptor[];
    released: DeviceDescriptor[];
    // debugReleased: DeviceDescriptor[];
    descriptors: DeviceDescriptor[];
};

const getDiff = (
    current: DeviceDescriptor[],
    descriptors: DeviceDescriptor[],
): DeviceDescriptorDiff => {
    const connected = descriptors.filter(d => current.find(x => x.path === d.path) === undefined);
    const disconnected = current.filter(
        d => descriptors.find(x => x.path === d.path) === undefined,
    );
    const changedSessions = descriptors.filter(d => {
        const currentDescriptor = current.find(x => x.path === d.path);
        if (currentDescriptor) {
            // return currentDescriptor.debug ? (currentDescriptor.debugSession !== d.debugSession) : (currentDescriptor.session !== d.session);
            return currentDescriptor.session !== d.session;
        }
        return false;
    });
    const acquired = changedSessions.filter(d => typeof d.session === 'string');
    const released = changedSessions.filter(
        d =>
            // const session = descriptor.debug ? descriptor.debugSession : descriptor.session;
            typeof d.session !== 'string',
    );

    const didUpdate = connected.length + disconnected.length + changedSessions.length > 0;

    return {
        connected,
        disconnected,
        changedSessions,
        acquired,
        released,
        didUpdate,
        descriptors,
    };
};

// todo: duplicated with connect
const TRANSPORT = {
    START: 'transport-start',
    ERROR: 'transport-error',
    UPDATE: 'transport-update',
    STREAM: 'transport-stream',
    REQUEST: 'transport-request_device',
    DISABLE_WEBUSB: 'transport-disable_webusb',
    START_PENDING: 'transport-start_pending',
} as const;

// todo: duplicated with connect
const DEVICE = {
    // device list events
    CONNECT: 'device-connect',
    CONNECT_UNACQUIRED: 'device-connect_unacquired',
    DISCONNECT: 'device-disconnect',
    CHANGED: 'device-changed',
    ACQUIRE: 'device-acquire',
    RELEASE: 'device-release',
    ACQUIRED: 'device-acquired',
    RELEASED: 'device-released',
    USED_ELSEWHERE: 'device-used_elsewhere',

    LOADING: 'device-loading',

    // trezor-link events in protobuf format
    BUTTON: 'button',
    PIN: 'pin',
    PASSPHRASE: 'passphrase',
    PASSPHRASE_ON_DEVICE: 'passphrase_on_device',
    WORD: 'word',
} as const;

export abstract class Transport extends EventEmitter {
    configured = false;
    messages: protobuf.Root;
    name = '';
    version = '';
    abstract priority: number;

    isOutdated = false;

    descriptors: Descriptor[];

    constructor({ messages }: ConstructorParams) {
        super();
        this.descriptors = [];
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
     * - should call onDescriptorsUpdated in the end
     */
    abstract listen(): Promise<TrezorDeviceInfoWithSession[]>;

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

    /**
     * common method for all types of transports. should be called
     * after every enumeration cycle
     */
    _onListenResult(nextDescriptors: Descriptor[]) {
        console.log('transport: abstract: _onListenResult');
        console.log('transport: abstract: _onListenResult: this.descriptors', this.descriptors);
        console.log('transport: abstract: _onListenResult: nextDescriptors', nextDescriptors);

        const diff = getDiff(this.descriptors, nextDescriptors);
        console.log('transport: abstract: diff', diff);

        this.descriptors = nextDescriptors;

        if (diff.didUpdate) {
            diff.connected.forEach(d => {
                this.emit(DEVICE.CONNECT, d);
            });
            diff.disconnected.forEach(d => {
                this.emit(DEVICE.DISCONNECT, d);
            });
            diff.acquired.forEach(d => {
                this.emit(DEVICE.ACQUIRED, d);
            });
            diff.released.forEach(d => {
                this.emit(DEVICE.RELEASED, d);
            });
            diff.changedSessions.forEach(d => {
                this.emit(DEVICE.CHANGED, d);
            });
            this.emit(TRANSPORT.UPDATE, diff);
        }
    }
}

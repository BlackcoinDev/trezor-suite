// @ts-nocheck
// original file https://github.com/trezor/connect/blob/develop/src/js/device/DeviceList.js

/* eslint-disable max-classes-per-file, @typescript-eslint/no-use-before-define */

import EventEmitter from 'events';
import {
    BridgeTransport,
    WebUsbTransport,
    Transport,
    TrezorDeviceInfoWithSession as DeviceDescriptor,
    getAvailableTransport,
    setFetch as setTransportFetch,
} from '@trezor/transport';
import fetch from 'cross-fetch';
import { getAbortController } from './AbortController';

import { ERRORS } from '../constants';
import { TRANSPORT, DEVICE, TransportInfo } from '../events';
import { Device } from './Device';
import type { Device as DeviceTyped } from '../types';
import { DataManager } from '../data/DataManager';
import { getBridgeInfo } from '../data/transportInfo';
import { initLog } from '../utils/debug';
import { resolveAfter } from '../utils/promiseUtils';

import { ReactNativeUsbPlugin } from '../workers/workers';
import type { Controller } from './AbortController';

// custom log
const _log = initLog('DeviceList');

// TODO: plugins are not typed in 'trezor-link'
type LowLevelPlugin = {
    name: 'WebUsbPlugin' | 'ReactNativePlugin';
    unreadableHidDeviceChange: {
        on: (event: string, fn: any) => void;
    };
    unreadableHidDevice: boolean; // not sure
};

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

interface DeviceListEvents {
    [TRANSPORT.START]: TransportInfo;
    [TRANSPORT.ERROR]: string;
    [DEVICE.CONNECT]: DeviceTyped;
    [DEVICE.CONNECT_UNACQUIRED]: DeviceTyped;
    [DEVICE.DISCONNECT]: DeviceTyped;
    [DEVICE.CHANGED]: DeviceTyped;
    [DEVICE.RELEASED]: DeviceTyped;
    [DEVICE.ACQUIRED]: DeviceTyped;
}

export interface DeviceList {
    on<K extends keyof DeviceListEvents>(
        type: K,
        listener: (event: DeviceListEvents[K]) => void,
    ): this;
    off<K extends keyof DeviceListEvents>(
        type: K,
        listener: (event: DeviceListEvents[K]) => void,
    ): this;
    emit<K extends keyof DeviceListEvents>(type: K, args: DeviceListEvents[K]): boolean;
}
export class DeviceList extends EventEmitter {
    // @ts-expect-error
    transport: Transport;

    // array of transport that might be used in this environment
    transports: Transport[];

    transportPlugin: LowLevelPlugin | typeof undefined;

    devices: { [path: string]: Device } = {};

    creatingDevicesDescriptors: { [k: string]: DeviceDescriptor } = {};

    messages: JSON;

    transportStartPending = 0;

    penalizedDevices: { [deviceID: string]: number } = {};

    fetchController?: Controller | null;

    constructor() {
        super();
        const { env, webusb } = DataManager.settings;
        // const { env } = DataManager.settings;

        const transports: Transport[] = [];
        this.messages = DataManager.getProtobufMessages();

        if (env === 'react-native' && typeof ReactNativeUsbPlugin !== 'undefined') {
            transports.push(ReactNativeUsbPlugin());
        } else {
            // const bridgeLatestVersion = getBridgeInfo().version.join('.');
            const bridge = new BridgeTransport({ messages: this.messages });
            // bridge.setBridgeLatestVersion(bridgeLatestVersion);
            this.fetchController = getAbortController();
            const { signal } = this.fetchController;
            // @ts-expect-error TODO: https://github.com/trezor/trezor-suite/issues/5332
            const fetchWithSignal = (args, options = {}) => fetch(args, { ...options, signal });
            // detection of environment browser/node
            // todo: code should not be detecting environment itself. imho it should be built with this information passed from build process maybe?
            const isNode =
                !!process?.release?.name && process.release.name.search(/node|io\.js/) !== -1;
            setTransportFetch(fetchWithSignal, isNode);
            // transports.push(bridge);
        }

        // if (webusb) {
        transports.push(new WebUsbTransport({ messages: this.messages }));
        // }

        this.transports = transports.sort((a, b) => a.priority - b.priority);
    }

    async init() {
        console.log('DeviceList, init');

        try {
            _log.debug('Initializing transports');

            let lastError: any = null;

            console.log('DeviceList, this.transports.lenght', this.transports);
            for (const transport of this.transports) {
                try {
                    this.transport = transport;

                    // this.transport.on(TRANSPORT.START_PENDING, (pending: number) => {
                    //     this.transportStartPending = pending;
                    // });

                    await this.transport.init();
                } catch (error) {
                    console.log('DeviceList init try init catch error=', error);
                    lastError = error;
                }
            }

            console.log('DeviceList init lastError=', lastError);

            if (lastError) {
                throw lastError || new Error('No transport could be initialized.');
            }

            this.emit(TRANSPORT.START, this.getTransportInfo());

            // todo: maybe event should have different name
            this.transport.on(TRANSPORT.UPDATE, (diff: DeviceDescriptorDiff) => {
                new DiffHandler(this, diff).handle();
            });

            this.transport.on(TRANSPORT.ERROR, error => {
                console.log('DeviceList.on(TRANSPORT.ERROR, error=', error);
                this.emit(TRANSPORT.ERROR, error);
                // stream.stop();
            });

            console.log('DeviceList, init, transport.listen()');
            this.transport.listen();

            // listen for self emitted events and resolve pending transport event if needed
            this.on(DEVICE.CONNECT, this.resolveTransportEvent.bind(this));
            this.on(DEVICE.CONNECT_UNACQUIRED, this.resolveTransportEvent.bind(this));
        } catch (error) {
            console.log('DeviceList.init catch error=', error);
            this.emit(TRANSPORT.ERROR, error);
        }
    }

    resolveTransportEvent() {
        this.transportStartPending--;
        if (this.transportStartPending === 0) {
            // this.stream.emit(TRANSPORT.START);
        }
    }

    async waitForTransportFirstEvent() {
        await new Promise<void>(resolve => {
            const handler = () => {
                this.removeListener(TRANSPORT.START, handler);
                this.removeListener(TRANSPORT.ERROR, handler);
                resolve();
            };
            this.on(TRANSPORT.START, handler);
            this.on(TRANSPORT.ERROR, handler);
        });
    }

    async _createAndSaveDevice(descriptor: DeviceDescriptor) {
        _log.debug('Creating Device', descriptor);
        await new CreateDeviceHandler(descriptor, this).handle();
    }

    _createUnacquiredDevice(descriptor: DeviceDescriptor) {
        _log.debug('Creating Unacquired Device', descriptor);
        const device = Device.createUnacquired(this.transport, descriptor);
        device.once(DEVICE.ACQUIRED, () => {
            // emit connect event once device becomes acquired
            this.emit(DEVICE.CONNECT, device.toMessageObject());
        });
        return device;
    }

    _createUnreadableDevice(descriptor: DeviceDescriptor, unreadableError: string) {
        _log.debug('Creating Unreadable Device', descriptor, unreadableError);
        return Device.createUnacquired(this.transport, descriptor, unreadableError);
    }

    getDevice(path: string) {
        return this.devices[path];
    }

    getFirstDevicePath() {
        return this.asArray()[0].path;
    }

    asArray(): DeviceTyped[] {
        return this.allDevices().map(device => device.toMessageObject());
    }

    allDevices(): Device[] {
        return Object.keys(this.devices).map(key => this.devices[key]);
    }

    length() {
        return this.asArray().length;
    }

    transportType() {
        const { transport, transportPlugin } = this;
        if (transport.name === 'BridgeTransport') {
            return 'bridge';
        }
        if (transportPlugin) {
            return transportPlugin.name;
        }
        return transport.name;
    }

    getTransportInfo(): TransportInfo {
        return {
            type: this.transportType(),
            version: this.transport.version,
            outdated: this.transport.isOutdated,
        };
    }

    dispose() {
        this.removeAllListeners();

        // if (this.stream) {
        //     this.stream.stop();
        // }
        if (this.transport) {
            this.transport.stop();
        }
        if (this.fetchController) {
            this.fetchController.abort();
            this.fetchController = null;
        }

        this.allDevices().forEach(device => device.dispose());
    }

    disconnectDevices() {
        this.allDevices().forEach(device => {
            // device.disconnect();
            this.emit(DEVICE.DISCONNECT, device.toMessageObject());
        });
    }

    enumerate() {
        console.log('DeviceList.enumerate ==> !!! =>> !!!!');

        // this.stream.enumerate();
        // if (!this.stream.current) return;
        // update current values
        // this.stream.current.forEach(descriptor => {
        //     const path = descriptor.path.toString();
        //     const device = this.devices[path];
        //     if (device) {
        //         device.updateDescriptor(descriptor);
        //     }
        // });
    }

    addAuthPenalty(device: Device) {
        if (!device.isInitialized() || device.isBootloader() || !device.features.device_id) return;
        const deviceID = device.features.device_id;
        const penalty = this.penalizedDevices[deviceID]
            ? this.penalizedDevices[deviceID] + 500
            : 2000;
        this.penalizedDevices[deviceID] = Math.min(penalty, 5000);
    }

    getAuthPenalty() {
        const { penalizedDevices } = this;
        return Object.keys(penalizedDevices).reduce(
            (penalty, key) => Math.max(penalty, penalizedDevices[key]),
            0,
        );
    }

    removeAuthPenalty(device: Device) {
        if (!device.isInitialized() || device.isBootloader() || !device.features.device_id) return;
        const deviceID = device.features.device_id;
        delete this.penalizedDevices[deviceID];
    }
}

/**
 * DeviceList initialization
 * returns instance of DeviceList
 * @returns {Promise<DeviceList>}
 */
export const getDeviceList = async () => {
    const list = new DeviceList();
    await list.init();
    return list;
};

// Helper class for creating new device
class CreateDeviceHandler {
    descriptor: DeviceDescriptor;

    list: DeviceList;

    path: string;

    constructor(descriptor: DeviceDescriptor, list: DeviceList) {
        this.descriptor = descriptor;
        this.list = list;
        this.path = descriptor.path.toString();
    }

    // main logic
    async handle() {
        console.log('DeviceList:handle');

        // creatingDevicesDescriptors is needed, so that if *during* creating of Device,
        // other application acquires the device and changes the descriptor,
        // the new unacquired device has correct descriptor
        this.list.creatingDevicesDescriptors[this.path] = this.descriptor;

        try {
            // "regular" device creation
            await this._takeAndCreateDevice();
        } catch (error) {
            console.log('DeviceList:handle error', error);
            _log.debug('Cannot create device', error);

            if (error.code === 'Device_NotFound') {
                // do nothing
                // it's a race condition between "device_changed" and "device_disconnected"
            } else if (
                error.message === ERRORS.WRONG_PREVIOUS_SESSION_ERROR_MESSAGE ||
                error.toString() === ERRORS.WEBUSB_ERROR_MESSAGE
            ) {
                this.list.enumerate();
                this._handleUsedElsewhere();
            } else if (error.message.indexOf(ERRORS.LIBUSB_ERROR_MESSAGE) >= 0) {
                // catch one of trezord LIBUSB_ERRORs
                const device = this.list._createUnreadableDevice(
                    this.list.creatingDevicesDescriptors[this.path],
                    error.message,
                );
                this.list.devices[this.path] = device;
                this.list.emit(DEVICE.CONNECT_UNACQUIRED, device.toMessageObject());
            } else if (error.code === 'Device_InitializeFailed') {
                // firmware bug - device is in "show address" state which cannot be cancelled
                this._handleUsedElsewhere();
            } else if (error.code === 'Device_UsedElsewhere') {
                // most common error - someone else took the device at the same time
                this._handleUsedElsewhere();
            } else {
                await resolveAfter(501, null);
                await this.handle();
            }
        }
        delete this.list.creatingDevicesDescriptors[this.path];
    }

    async _takeAndCreateDevice() {
        console.log('DeviceList, _takeAndCreateDevice');
        const device = Device.fromDescriptor(this.list.transport, this.descriptor);
        console.log('DeviceList, _takeAndCreateDevice device', device);

        this.list.devices[this.path] = device;
        const promise = device.run();

        await promise;
        console.log('DeviceList, _takeAndCreateDevice. run completed, emit DEVICE.CONNECT');
        this.list.emit(DEVICE.CONNECT, device.toMessageObject());
    }

    _handleUsedElsewhere() {
        const device = this.list._createUnacquiredDevice(
            this.list.creatingDevicesDescriptors[this.path],
        );
        this.list.devices[this.path] = device;
        this.list.emit(DEVICE.CONNECT_UNACQUIRED, device.toMessageObject());
    }
}

// Helper class for actual logic of handling differences
class DiffHandler {
    list: DeviceList;

    diff: DeviceDescriptorDiff;

    constructor(list: DeviceList, diff: DeviceDescriptorDiff) {
        this.list = list;
        this.diff = diff;
    }

    handle() {
        _log.debug('Update DescriptorStream', this.diff);

        // note - this intentionally does not wait for connected devices
        // createDevice inside waits for the updateDescriptor event
        this._createConnectedDevices();
        this._createReleasedDevices();
        this._signalAcquiredDevices();

        this._updateDescriptors();
        this._emitEvents();
        this._disconnectDevices();
    }

    _updateDescriptors() {
        this.diff.descriptors.forEach((descriptor: DeviceDescriptor) => {
            const path = descriptor.path.toString();
            const device = this.list.devices[path];
            if (device) {
                device.updateDescriptor(descriptor);
            }
        });
    }

    _emitEvents() {
        const events = [
            {
                d: this.diff.changedSessions,
                e: DEVICE.CHANGED,
            },
            {
                d: this.diff.acquired,
                e: DEVICE.ACQUIRED,
            },
            {
                d: this.diff.released,
                e: DEVICE.RELEASED,
            },
        ];

        events.forEach(({ d, e }) => {
            d.forEach(descriptor => {
                const path = descriptor.path.toString();
                const device = this.list.devices[path];
                _log.debug('Event', e, device);
                if (device) {
                    this.list.emit(e, device.toMessageObject());
                }
            });
        });
    }

    // tries to read info about connected devices
    _createConnectedDevices() {
        console.log('DeviceList, _createConnectedDevices');
        this.diff.connected.forEach(async descriptor => {
            const path = descriptor.path.toString();
            const priority = DataManager.getSettings('priority');
            const penalty = this.list.getAuthPenalty();
            console.log('DeviceList, _createConnectedDevices, descriptor', descriptor);
            _log.debug('Connected', priority, penalty, descriptor.session, this.list.devices);
            if (priority || penalty) {
                await resolveAfter(501 + penalty + 100 * priority, null);
            }
            if (descriptor.session == null) {
                await this.list._createAndSaveDevice(descriptor);
            } else {
                const device = this.list._createUnacquiredDevice(descriptor);
                this.list.devices[path] = device;
                this.list.emit(DEVICE.CONNECT_UNACQUIRED, device.toMessageObject());
            }
        });
    }

    _signalAcquiredDevices() {
        this.diff.acquired.forEach(descriptor => {
            const path = descriptor.path.toString();
            if (this.list.creatingDevicesDescriptors[path]) {
                this.list.creatingDevicesDescriptors[path] = descriptor;
            }
        });
    }

    // tries acquire and read info about recently released devices
    _createReleasedDevices() {
        this.diff.released.forEach(async descriptor => {
            const path = descriptor.path.toString();
            const device = this.list.devices[path];
            if (device) {
                if (device.isUnacquired() && !device.isInconsistent()) {
                    // wait for publish changes
                    await resolveAfter(501, null);
                    _log.debug('Create device from unacquired', device);
                    await this.list._createAndSaveDevice(descriptor);
                }
            }
        });
    }

    _disconnectDevices() {
        this.diff.disconnected.forEach(descriptor => {
            const path = descriptor.path.toString();
            const device = this.list.devices[path];
            if (device != null) {
                device.disconnect();
                delete this.list.devices[path];
                this.list.emit(DEVICE.DISCONNECT, device.toMessageObject());
            }
        });
    }
}

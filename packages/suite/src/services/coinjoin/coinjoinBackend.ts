import { CoinjoinBackend } from '@trezor/coinjoin';
import { createIpcProxy } from '@trezor/ipc-proxy';
import { isDesktop } from '@suite-utils/env';
import { Account, CoinjoinServerEnvironment } from '@suite-common/wallet-types';
import { COINJOIN_NETWORKS } from './config';

const loadInstance = (network: string, environment?: CoinjoinServerEnvironment) => {
    const settings =
        environment === 'localhost'
            ? COINJOIN_NETWORKS.regtestLocalhost
            : COINJOIN_NETWORKS[network];

    if (isDesktop()) {
        return createIpcProxy<CoinjoinBackend>(
            'CoinjoinBackend',
            { target: { settings } },
            settings,
        );
    }
    return import(/* webpackChunkName: "coinjoin" */ '@trezor/coinjoin').then(
        pkg => new pkg.CoinjoinBackend(settings),
    );
};

export class CoinjoinBackendService {
    private static instances: Record<string, CoinjoinBackend> = {};

    static async createInstance(network: string, environment?: CoinjoinServerEnvironment) {
        if (this.instances[network]) return this.instances[network];
        const instance = await loadInstance(network, environment);
        this.instances[network] = instance;
        return instance;
    }

    static getInstance(network: string): CoinjoinBackend | undefined {
        return this.instances[network];
    }

    static getInstances() {
        return Object.keys(this.instances).map(key => this.instances[key]);
    }

    static removeInstance(network: string) {
        if (this.instances[network]) {
            this.instances[network].cancel();
            delete this.instances[network];
        }
    }
}

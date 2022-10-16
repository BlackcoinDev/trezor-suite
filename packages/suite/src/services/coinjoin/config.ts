import { CoinjoinBackendSettings, CoinjoinClientSettings } from '@trezor/coinjoin';

export const COINJOIN_SERVERS = {
    regtest: {
        public: 'https://dev-coinjoin.trezor.io/',
        localhost: 'http://localhost:8081/', // local instance of https://github.com/trezor/coinjoin-backend
    },
};

type CoinjoinNetworksConfig = CoinjoinBackendSettings &
    CoinjoinClientSettings & {
        percentageFee: string;
    };

export const COINJOIN_NETWORKS: Record<string, CoinjoinNetworksConfig> = {
    regtest: {
        network: 'regtest',
        coordinatorName: 'CoinJoinCoordinatorIdentifier',
        coordinatorUrl: `${COINJOIN_SERVERS.regtest.public}WabiSabi/`,
        // backend settings
        blockbookUrls: [`${COINJOIN_SERVERS.regtest.public}blockbook/api/v2`],
        baseBlockHeight: 0,
        baseBlockHash: '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206',
        // client settings
        middlewareUrl: `${COINJOIN_SERVERS.regtest.public}Cryptography/`,
        // suite settings
        percentageFee: '0.03',
    },
    regtestLocalhost: {
        network: 'regtest',
        coordinatorName: 'CoinJoinCoordinatorIdentifier',
        coordinatorUrl: `${COINJOIN_SERVERS.regtest.localhost}WabiSabi/`,
        // backend settings
        blockbookUrls: [`${COINJOIN_SERVERS.regtest.localhost}blockbook/api/v2`],
        baseBlockHeight: 0,
        baseBlockHash: '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206',
        // client settings
        middlewareUrl: `${COINJOIN_SERVERS.regtest.localhost}Cryptography/`,
        // suite settings
        percentageFee: '0.03',
    },
};

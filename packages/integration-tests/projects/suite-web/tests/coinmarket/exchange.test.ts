// @group:coinmarket

describe('Coinmarket exchange', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { needs_backup: false });
        cy.task('startBridge');

        cy.viewport(1024, 768).resetDb();
        cy.interceptInvityApi();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
        cy.enableRegtestAndGetCoins({
            payments: [
                {
                    address: 'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v',
                    amount: 1,
                },
            ],
        });
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.getTestElement('@account-menu/regtest/normal/0/label').click();
        cy.getTestElement('@wallet/menu/wallet-coinmarket-buy').click();
        cy.getTestElement('@coinmarket/menu/wallet-coinmarket-exchange').click();
    });

    it('Should exchange crypto successfully', () => {
        // Tests all input windows are empty
        cy.getTestElement('@coinmarket/exchange/crypto-input').should('have.value', ''); // shoulds have issues in all instances
        cy.getTestElement('@coinmarket/exchange/fiat-input').should('have.value', '');

        // Tests crypto input contains REGTEST
        cy.getTestElement('@coinmarket/exchange/crypto-input').should('contain.text', 'REGTEST');

        // Fills out 0.005REGTEST and chooses ETH as target crypto */
        cy.getTestElement('@coinmarket/exchange/crypto-input').type('0.005');
        cy.getTestElement('@coinmarket/exchange/fiat-select').click();
        // Needs to pick ETH from the dropdown menu

        // Custom fee setup
        cy.getTestElement('select-bar/custom').click();
        cy.getTestElement('feePerUnit').clear().type('1');
        // cy.getTestElement('@CoinmarketExchangeReceiveCryptoSelect').click();
        cy.getTestElement('@coinmarket/exchange/compare-button').click();

        // Tests offer accordance with the mocks
        cy.contains('changehero').should('exist');
        cy.contains('changelly').should('exist');
        cy.contains('changenowfr').should('exist');

        // Gets the deal
        cy.getTestElement('@coinmarket/exchange/offers/get-this-deal-button').eq(2).click();
        cy.getTestElement('@modal').should('be.visible');
        cy.getTestElement('@coinmarket/exchange/offers/buy-terms-agree-checkbox').click();
        cy.getTestElement('@coinmarket/exchange/offers/buy-terms-confirm-button').click();
        cy.getTestElement('@coinmarket/exchange/offers/confirm-on-trezor-button').click();
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');

        //
        cy.getTestElement('@CoinmarketExchangeOfferInfo').should('have.value', '0.00500000 BTC');
        cy.get('CoinmarketExchangeOfferInfo').should('have.value', '0.063230 ETH'); // Copying Kuba's syntax from buy test
        cy.getTestElement('@CoinmarketExchangeProviderInfo').should('have.value', 'Changelly');
        cy.get('AddressOptions').should('have.value', '0x8185b57ac7ee339245dd2c06Bdd056Aec2844d4D');

        cy.getTestElement('@coinmarket/exchange/offers/finish-transaction-button').click();
        cy.getTestElement('@ConfirmOnTrezorAndSend').click(); // Data test id in progress
        cy.getConfirmActionOnDeviceModal(); // This might be the wrong command for Trezor, WIP
        // Verification of REG and ETH amounts
        // Hold to confirm on Trezor command
        // Press Send in suite

        // Pending watch success mock, need help here
    });

    /* it("Should remember form's values as a draft", () => {
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.getTestElement('@wallet/menu/wallet-coinmarket-buy').click();
        cy.getTestElement('@coinmarket/menu/wallet-coinmarket-exchange').click();

        cy.prefixedVisit('/accounts/coinmarket/exchange/#/btc/0');
        cy.getTestElement('@coinmarket/exchange/fiat-input').type('1000');
        cy.prefixedVisit('/accounts');
        cy.getTestElement('@coinmarket/exchange/fiat-input').should('have.value', '1000');

        // TODO: rest of inputs
    });

    it('Should clear form draft', () => {
        cy.getTestElement('@coinmarket/exchange/fiat-input').type('1000');
        cy.getTestElement('(clear form button id)').click();
        cy.getTestElement('@coinmarket/exchange/fiat-input').should('have.value', '');

        // TODO: fill and reset rest of inputs
    }); */
});

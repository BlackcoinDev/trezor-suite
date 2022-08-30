// @group:coinmarket

describe('Coinmarket buy', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { needs_backup: false });
        cy.task('startBridge');

        cy.viewport(1024, 768).resetDb();
        cy.interceptInvityApi();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
        // navigate to buy
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.getTestElement('@wallet/menu/wallet-coinmarket-buy').click();
    });

    /**
     * 1. Navigates to Trade/Buy.
     * 2. Verifies the mocked API response (country:AT).
     * 3. Fills in an amount and clicks “Compare offers”.
     * 4. Verifies the mocked API response (only offers from the mocked file, e.g. banxa, btcdirect).
     * 5. Picks one offer and clicks “Get this deal”.
     * 6. Verifies that a modal opens.
     * 7. Clicks the checkbox and “Confirm”.
     * 8. Clicks “Confirm on Trezor”  in Suite and on the emulator.
     * 9. Verifies “Confirmed on Trezor” text.
     * 10. Verifies the amount, currency, crypto, provider and payment method all match the mocked/given data.
     * 11. Clicks “Finish transaction”.
     * 12. Up Next: Mocking interaction with the partners.
     */

    it.only('Should buy crypto successfully', () => {
        cy.getTestElement('@coinmarket/buy/country-select/input').should('contain.text', 'Austria');
        cy.getTestElement('@coinmarket/buy/crypto-input').should('have.value', '');
        cy.getTestElement('@coinmarket/buy/fiat-input').should('have.value', '');
        cy.getTestElement('@coinmarket/buy/crypto-currency-select/input').should(
            'contain.text',
            'BTC',
        );
        cy.getTestElement('@coinmarket/buy/fiat-currency-select/input').should(
            'contain.text',
            'EUR',
        );

        cy.getTestElement('@coinmarket/buy/fiat-input').type('500');
        cy.getTestElement('@coinmarket/buy/fiat-input').should('have.value', '500');
        cy.getTestElement('@coinmarket/buy/compare-button').click();

        cy.contains('banxa').should('exist');
        cy.contains('btcdirect').should('exist');

        cy.getTestElement('@coinmarket/buy/offers/get-this-deal-button').eq(2).click();
        cy.getTestElement('@modal').should('be.visible');
        cy.getTestElement('@coinmarket/buy/offers/buy-terms-agree-checkbox').click();
        cy.getTestElement('@coinmarket/buy/offers/buy-terms-confirm-button').click();
        cy.getTestElement('@coinmarket/buy/offers/confirm-on-trezor-button').click();
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');

        cy.getTestElement('@CoinmarketBuyOfferInfo').should('have.value', '0.020740 BTC');
        cy.contains('[class^="CoinmarketBuyOfferInfo"]', 'buy');
        cy.get('CoinmarketBuyOfferInfo').should('have.value', '500 EUR');
        cy.get('CoinmarketProviderInfo').should('have.value', 'Banxa');
        cy.get('CoinmarketPaymentType').should('have.value', 'Bank Transfer');
        cy.get('AddressOptions').should('have.value', 'bc1qfcjv620stvtzjeelg26ncgww8ks49zy8lracjz');

        cy.getTestElement('@coinmarket/buy/offers/finish-transaction-button').click();
        cy.url().should(
            'not.eq',
            'https://suite.trezor.io/web/accounts/coinmarket/buy/offers#/btc/0',
        );

        // TODO: click buy button on mocked server
        // TODO: check the UI in suite for completed tx
    });

    /* it('Should show same crypto currency as it has been chosen (BTC)', () => {
        // Cannot easily check selected account for now. Rely on URI.
        cy.getTestElement('@coinmarket/buy/crypto-currency-select/input').contains('BTC');
    });

    it("Should remember form's values as a draft", () => {
        // TODO-test: set also country and verify that it is remembered

        cy.getTestElement('@coinmarket/buy/fiat-input').type('1000');
        cy.wait(1000);

        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.getTestElement('@wallet/menu/wallet-coinmarket-buy').click();
        cy.getTestElement('@coinmarket/buy/fiat-input').should('have.value', '1000');
    });

    it('Should clear form draft', () => {
        // TODO-test: set fiat or crypto input, press clear button and verify that the form is empty
    });

    it('Should get error on non numeric value typed to fiat input', () => {
        // TODO-test: enter non numeric value to the fiat input field and verify that an error is shown
    }); */
});

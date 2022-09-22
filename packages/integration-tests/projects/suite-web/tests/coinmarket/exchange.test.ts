// @group:coinmarket

describe('Coinmarket exchange', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: false,
            mnemonic:
                'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
        });
        cy.task('startBridge');

        cy.viewport(1080, 1440).resetDb();
        cy.interceptInvityApi();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
        cy.enableRegtestAndGetCoins({
            payments: [
                {
                    address: 'bcrt1qnspxpr2xj9s2jt6qlhuvdnxw6q55jvyg6q7g5r',
                    amount: 1,
                },
            ],
        });

        // Enables ETH account
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@settings/menu/wallet').click();
        cy.getTestElement('@settings/wallet/network/eth').click();
        cy.getTestElement('@settings/menu/close').click();

        // Goes to Exchange
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.getTestElement('@account-menu/regtest/normal/0/label').click();
        cy.getTestElement('@wallet/menu/wallet-coinmarket-buy').click();
        cy.getTestElement('@coinmarket/menu/wallet-coinmarket-exchange').click();
    });

    it('Should exchange crypto successfully', () => {
        cy.discoveryShouldFinish();
        // Tests all input windows are empty
        cy.getTestElement('@coinmarket/exchange/crypto-input').should('have.value', '');
        cy.getTestElement('@coinmarket/exchange/fiat-input').should('have.value', '');

        // Tests crypto input contains REGTEST
        cy.getTestElement('@coinmarket/exchange/crypto-currency-select/input').should(
            'contain.text',
            'REGTEST',
        );

        // Fills out 0.005REGTEST and chooses ETH as target crypto */
        cy.getTestElement('@coinmarket/exchange/crypto-input').type('0.005');
        cy.getTestElement('@coinmarket/exchange/receive-crypto-select/input').type('ETH{enter}');

        // Custom fee setup
        cy.getTestElement('select-bar/custom').click();
        cy.getTestElement('feePerUnit').clear().type('1');
        cy.getTestElement('@coinmarket/exchange/compare-button').click();

        // Verifies the offers displayed match the mock
        cy.fixture('./invity/exchange/quotes').then((quotes: any) => {
            const exchangeProvider = [
                ['changehero', 'changehero'],
                ['changenow', 'changenow'],
                ['changelly', 'changelly'],
            ];

            exchangeProvider.forEach((provider: string[]) => {
                // Tests offer accordance with the mocks
                const valueFromFixtures = quotes.find(
                    (quote: any) => quote.exchange === provider[1],
                );
                cy.contains('[class*="Quote__Wrapper"]', provider[0], { matchCase: false })
                    .should('exist')
                    .find('[class*="CryptoAmount__Value"]') // Returns element handle
                    .invoke('text')
                    .then((readValue: string) => {
                        const ethValueFromApp: number = parseFloat(readValue);
                        const ethValueFromQuote: number = parseFloat(
                            valueFromFixtures.receiveStringAmount,
                        );
                        expect(ethValueFromApp).to.be.eq(ethValueFromQuote);
                    });
            });
        });

        // Gets the deal
        cy.getTestElement('@coinmarket/exchange/offers/get-this-deal-button').eq(0).click();
        cy.getTestElement('@modal').should('be.visible');
        cy.getTestElement('@coinmarket/exchange/offers/buy-terms-agree-checkbox').click();
        cy.getTestElement('@coinmarket/exchange/offers/buy-terms-confirm-button').click();

        // Verifies amounts, currencies and providers
        cy.get('[class*="CoinmarketExchangeOfferInfo__Wrapper"]')
            .should('exist')
            .then(wrapper => {
                cy.wrap(wrapper)
                    .find('[class*="FormattedCryptoAmount__Value"]')
                    .first()
                    .invoke('text')
                    .should('be.equal', '0.005');
                cy.wrap(wrapper)
                    .find('[class*="FormattedCryptoAmount__Value"]')
                    .eq(1)
                    .invoke('text')
                    .should('be.equal', '0.053845');
                cy.wrap(wrapper)
                    .find('[class*="FormattedCryptoAmount__Symbol"]')
                    .first()
                    .should('contain.text', 'REGTEST');
                cy.wrap(wrapper)
                    .find('[class*="FormattedCryptoAmount__Symbol"]')
                    .last()
                    .should('contain.text', 'ETH');
                cy.wrap(wrapper)
                    .find('[class*="CoinmarketProviderInfo__Text"]')
                    .invoke('text')
                    .should('be.equal', 'ChangeHero');
            });

        // Verifies receiving address and its title
        cy.get('[class*="VerifyAddress__Wrapper"]')
            .should('exist')
            .then(wrapper => {
                cy.wrap(wrapper)
                    .find('[class*="AccountLabeling__TabularNums"]')
                    .invoke('text')
                    .should('be.equal', 'Ethereum #1');
                cy.wrap(wrapper)
                    .find('[class*="Input__StyledInput"]')
                    .should('have.value', '0x3f2329C9ADFbcCd9A84f52c906E936A42dA18CB8');
            });

        // Confirming the transaction
        cy.getTestElement('@coinmarket/exchange/offers/confirm-on-trezor-button').click();
        cy.getTestElement('@prompts/confirm-on-device');
        cy.task('pressYes');
        cy.getTestElement('@coinmarket/exchange/offers/continue-transaction-button').click();
        cy.getTestElement('@coinmarket/exchange/offers/confirm-on-trezor-and-send').click();

        // Verification modal opens
        cy.get('[class*="OutputElement__OutputWrapper"]')
            .should('exist')
            .then(wrapper => {
                cy.wrap(wrapper)
                    .find('[class*="OutputElement__OutputHeadline"]')
                    .first()
                    .invoke('text')
                    .should('be.equal', '2N4dH9yn4eYnnjHTYpN9xDmuMRS2k1AHWd8... ');
                cy.wrap(wrapper)
                    .find('[class*="FormattedCryptoAmount__Value"]')
                    .first()
                    .invoke('text')
                    .should('be.equal', '0.005');
                cy.wrap(wrapper)
                    .find('[class*="FormattedCryptoAmount__Symbol"]')
                    .first()
                    .should('contain.text', 'REGTEST');
            });
        cy.get('[class*="Summary__Wrapper"]')
            .should('exist')
            .then(wrapper => {
                cy.wrap(wrapper)
                    .find('[class*="Summary__ReviewRbfLeftDetailsLineRight"]')
                    .eq(0)
                    .invoke('text')
                    .should('be.equal', '1 sat/B');
            });
        cy.task('pressYes');
        cy.task('pressYes');
        cy.contains('Send').click(); // Need to add data-test-id to "Send" button
        // Verifies a banner displays
        // cy.getTestElement('@banner-data-test-id').should('be.visible);
    });
    /* it("Should remember form's values as a draft", () => {
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.getTestElement('@wallet/menu/wallet-coinmarket-buy').click();
        cy.getTestElement('@coinmarket/menu/wallet-coinmarket-exchange').click();

        cy.prefixedVisit('/accounts/coinmarket/exchange/#/btc/0');
        cy.getTestElement('@coinmarket/exchange/fiat-input').type('1000');
        cy.prefixedVisit('/accounts');
        cy.getTestElement('@coinmarket/exchange/fiat-input').should('have.value', '1000');
    });

    it('Should clear form draft', () => {
        cy.getTestElement('@coinmarket/exchange/fiat-input').type('1000');
        cy.getTestElement('(clear form button id)').click();
        cy.getTestElement('@coinmarket/exchange/fiat-input').should('have.value', '');
    }); */
});

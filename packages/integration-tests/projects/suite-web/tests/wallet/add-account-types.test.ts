// @group:suite
// @retry=2

import { onAccountsPage } from '../../support/pageObjects/accountsObject';
import { onSettingsCryptoPage } from '../../support/pageObjects/settingsCryptoObject';
import { onTopBar } from '../../support/pageObjects/topBarObject';
import { NetworkSymbol } from '../../../../../../suite-common/wallet-config/src/networksConfig';

describe('Account types suite', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            mnemonic: 'town grace cat forest dress dust trick practice hair survey pupil regular',
        });
        cy.task('startBridge');

        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
    });

    afterEach(() => {
        cy.task('stopEmu');
    });

    /**
     * Test case
     * 1. Go to Accounts
     * 2. Unpack all account types
     * 3. Get the number of accounts
     * 4. Create new account for each account type
     * 5. Get the number of accounts again
     * 6. Verify that the current number is equeal to previous number + 1
     */
    it('Add-account-types-BTC', () => {
        //
        // Test preparation
        //
        const coin: NetworkSymbol = 'btc';
        const accsArray = [
            { type: 'normal', coinAccountName: 'Bitcoin' },
            { type: 'taproot', coinAccountName: 'Bitcoin (Taproot)' },
            { type: 'segwit', coinAccountName: 'Bitcoin (Legacy Segwit)' },
            { type: 'legacy', coinAccountName: 'Bitcoin (Legacy)' },
        ];

        //
        // Test execution
        //

        onTopBar.openAccounts();
        onAccountsPage.unpackAllAccountTypes();
        accsArray.forEach(({ type, coinAccountName }: { type: string; coinAccountName: string }) =>
            // for a specific type of BTC acc, get the current number of accounts
            cy
                .get(`[type="${type}"] > [data-test^="@account-menu/${coin}/${type}/"]`)
                .then(specificAccounts => {
                    const numberOfAccounts1 = specificAccounts.length;

                    // for a specific type of BTC acc, add a new acc
                    cy.createAccountFromMyAccounts(coin, coinAccountName);

                    // for a specific type of BTC acc, get the current number of accounts again for comparison
                    cy.get(`[type="${type}"] > [data-test^="@account-menu/${coin}/${type}/"]`).then(
                        specificAccounts => {
                            const numberOfAccounts2 = specificAccounts.length;

                            expect(numberOfAccounts2).to.be.equal(numberOfAccounts1 + 1);
                        },
                    );
                }),
        );
    });

    /**
     * Test case
     * 1. go to Settings
     * 2. activate LTC
     * 3. go to Accounts
     * 4. Unpack all account types
     * 5. Get the number of accounts
     * 6. Create new account for each account type
     * 7. Get the number of accounts again
     * 8. Verify that the current number is equeal to previous number + 1
     */
    it('Add-account-types-LTC', () => {
        //
        // Test preparation
        //
        const coin: NetworkSymbol = 'ltc';
        const accsArray = [
            { type: 'normal', coinAccountName: 'Litecoin' },
            { type: 'segwit', coinAccountName: 'Litecoin (segwit)' },
            { type: 'legacy', coinAccountName: 'Litecoin (legacy)' },
        ];

        //
        // Test execution
        //

        // activate the coin
        cy.prefixedVisit('/settings/coins');
        onSettingsCryptoPage.activateCoin(coin);

        onTopBar.openAccounts();
        onAccountsPage.applyCoinFilter(coin);
        cy.discoveryShouldFinish();
        onAccountsPage.unpackAllAccountTypes();

        accsArray.forEach(({ type, coinAccountName }: { type: string; coinAccountName: string }) =>
            cy
                .get(`[type="${type}"] > [data-test^="@account-menu/${coin}/${type}/"]`)
                .then(specificAccounts => {
                    const numberOfAccounts1 = specificAccounts.length;
                    cy.createAccountFromMyAccounts(coin, coinAccountName);
                    cy.get(`[type="${type}"] > [data-test^="@account-menu/${coin}/${type}/"]`).then(
                        specificAccounts => {
                            const numberOfAccounts2 = specificAccounts.length;
                            expect(numberOfAccounts2).to.be.equal(numberOfAccounts1 + 1);
                        },
                    );
                }),
        );
    });

    /**
     * Test case
     * 1. go to Settings
     * 2. activate ADA and ETH
     * 3. go to Accounts
     * 4. for each coin:
     * 5. Get the number of accounts
     * 6. Create new account
     * 7. Get the number of accounts again
     * 8. Verify that the current number is equeal to previous number + 1
     */
    it('Add-account-types-non-BTC-coins', () => {
        //
        // Test execution
        //
        const coins: NetworkSymbol[] = ['ada', 'eth'];

        // activate the coin
        cy.prefixedVisit('/settings/coins');
        coins.forEach((coin: NetworkSymbol) => {
            onSettingsCryptoPage.activateCoin(coin);
        });

        onTopBar.openAccounts();
        cy.discoveryShouldFinish();
        // cardano

        coins.forEach((coin: NetworkSymbol) => {
            onAccountsPage.applyCoinFilter(coin);
            // get the element containing all accounts
            cy.get(`[type="normal"] > [data-test*="@account-menu/${coin}/normal"]`).then(
                currentAccounts => {
                    const numberOfAccounts1 = currentAccounts.length;

                    cy.getTestElement('@account-menu/add-account').should('be.visible').click();
                    cy.getTestElement('@modal').should('be.visible');
                    cy.get(`[data-test="@settings/wallet/network/${coin}"]`)
                        .should('be.visible')
                        .click();
                    cy.getTestElement('@add-account').click();
                    cy.discoveryShouldFinish();

                    cy.get(`[type="normal"] > [data-test*="@account-menu/${coin}/normal"]`).then(
                        newAccounts => {
                            const numberOfAccounts2 = newAccounts.length;
                            expect(numberOfAccounts2).to.be.equal(numberOfAccounts1 + 1);
                        },
                    );
                },
            );
        });
    });
});

// @group:coinmarket

describe('Coinmarket sell', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { needs_backup: false });
        cy.task('startBridge');

        cy.viewport(1024, 768).resetDb();
        cy.interceptInvityApi();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
    });

    it('Should sell crypto successfully', () => {
        cy.getTestElement('@coinmarket/sell/crypto-input').type('0.005');
        // TODO: We need to connect to regtest blockchain so we can mock accounts as not empty and continue with sell process
    });

    it('Should show same crypto currency as it has been chosen (BTC)', () => {
        // Cannot easily check selected account for now. Rely on URI.
        cy.prefixedVisit('/accounts/coinmarket/sell/#/btc/0');
        cy.getTestElement('@coinmarket/sell/crypto-currency-select/input').contains('BTC');
    });

    it("Should remember form's values as a draft", () => {
        cy.prefixedVisit('/accounts/coinmarket/sell/#/btc/0');
        cy.getTestElement('@coinmarket/sell/fiat-input').type('1000');
        cy.prefixedVisit('/accounts');
        cy.getTestElement('@coinmarket/sell/fiat-input').should('have.value', '1000');

        // TODO: rest of inputs
    });

    it('Should clear form draft', () => {
        cy.prefixedVisit('/accounts/coinmarket/sell/#/btc/0');
        cy.getTestElement('@coinmarket/sell/fiat-input').type('1000');
        cy.getTestElement('(clear form button id)').click();
        cy.getTestElement('@coinmarket/sell/fiat-input').should('have.value', '');

        // TODO: rest of inputs
    });
});

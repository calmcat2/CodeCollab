// ***********************************************
// Custom Cypress commands for CodeCollab testing
// ***********************************************

declare global {
    namespace Cypress {
        interface Chainable {
            /**
             * Create a new session via API
             */
            createSession(): Chainable<{ id: string }>;

            /**
             * Join a session with a username
             */
            joinSession(sessionId: string, username: string): Chainable<void>;

            /**
             * Wait for WebSocket connection
             */
            waitForWebSocket(): Chainable<void>;
        }
    }
}

Cypress.Commands.add('createSession', () => {
    return cy.request('POST', `${Cypress.env('apiUrl')}/api/v1/sessions`)
        .its('body');
});

Cypress.Commands.add('joinSession', (sessionId: string, username: string) => {
    cy.visit(`/session/${sessionId}`);
    cy.get('input[placeholder*="username" i]', { timeout: 10000 }).should('be.visible');
    cy.get('input[placeholder*="username" i]').type(username);
    cy.contains('button', /join/i).click();
    cy.get('input[placeholder*="username" i]', { timeout: 10000 }).should('not.exist');
});

Cypress.Commands.add('waitForWebSocket', () => {
    // Wait for WebSocket connection to be established
    cy.wait(1000);
});

export { };

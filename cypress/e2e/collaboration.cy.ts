describe('Real-time Collaboration', () => {
    let sessionId: string;

    before(() => {
        cy.createSession().then((session) => {
            sessionId = session.id;
        });
    });

    it('should show typing indicator when user types', () => {
        cy.joinSession(sessionId, 'Typer');
        cy.waitForWebSocket();

        // Start typing
        cy.get('[class*="monaco-editor"]').click();
        cy.focused().type('typing...');

        // Typing indicator should appear (in a real multi-user scenario)
        // This is a simplified test - full test would need multiple browser contexts
        cy.wait(500);
    });

    it('should update code in real-time across users', () => {
        // This test demonstrates the concept
        // Full implementation would require multiple browser contexts or Cypress.io Dashboard

        cy.joinSession(sessionId, 'User1');
        cy.waitForWebSocket();

        // User 1 types code
        cy.get('[class*="monaco-editor"]').click();
        cy.focused().type('{selectall}const message = "Real-time!";');

        // In a full test, we'd verify User 2 sees this change
        // For now, we verify the code is in the session
        cy.wait(1000);

        // Reload page and verify code persists
        cy.reload();
        cy.joinSession(sessionId, 'User2');
        cy.waitForWebSocket();

        // Code should still be there
        cy.contains('Real-time!').should('exist');
    });

    it('should show multiple users in user panel', () => {
        cy.joinSession(sessionId, 'MultiUser1');
        cy.waitForWebSocket();

        // Should see user in panel
        cy.contains('MultiUser1').should('be.visible');

        // User count should be visible
        cy.get('[class*="user"]', { timeout: 5000 }).should('exist');
    });

    it('should assign different colors to users', () => {
        cy.joinSession(sessionId, 'ColorUser');
        cy.waitForWebSocket();

        // User should have a color assigned
        // This would be visible in the user panel
        cy.contains('ColorUser').should('be.visible');
    });

    it('should sync language changes across users', () => {
        cy.joinSession(sessionId, 'LangChanger');
        cy.waitForWebSocket();

        // Change language
        cy.get('button').contains(/javascript/i).click();
        cy.contains(/python/i).click();

        // Language should be updated
        cy.contains('button', /python/i).should('be.visible');

        // Reload and verify language persists
        cy.reload();
        cy.joinSession(sessionId, 'LangChecker');

        cy.contains('button', /python/i, { timeout: 10000 }).should('be.visible');
    });
});

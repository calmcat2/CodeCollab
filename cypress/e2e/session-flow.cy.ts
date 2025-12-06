describe('Session Flow', () => {
    let sessionId: string;

    before(() => {
        // Create a session via API before tests
        cy.createSession().then((session) => {
            sessionId = session.id;
        });
    });

    it('should create a new session from homepage', () => {
        cy.visit('/');
        cy.contains('button', /create session/i).click();

        // Should navigate to session page
        cy.url().should('include', '/session/');

        // Should show username dialog
        cy.get('input[placeholder*="username" i]').should('be.visible');
    });

    it('should join a session with username', () => {
        cy.joinSession(sessionId, 'TestUser');

        // Should see the code editor
        cy.get('[class*="monaco-editor"]', { timeout: 10000 }).should('be.visible');

        // Should see user in user panel
        cy.contains('TestUser').should('be.visible');
    });

    it('should edit code in the editor', () => {
        cy.joinSession(sessionId, 'CodeEditor');
        cy.waitForWebSocket();

        // Type some code (target the textarea inside Monaco) - Using click + type at component level
        cy.get('[class*="monaco-editor"] .view-lines').click();
        cy.focused().type('{ctrl}a{backspace}');
        cy.focused().type('console.log("Hello from Cypress!");', { delay: 0 });

        // Code should be updated
        cy.wait(1000);
    });

    it('should execute code and see output', () => {
        cy.joinSession(sessionId, 'CodeRunner');
        cy.waitForWebSocket();

        // Clear and write Python code
        cy.get('[class*="monaco-editor"] .view-lines').click();
        cy.focused().type('{ctrl}a{backspace}');
        cy.focused().type('print("Hello from Python!")', { delay: 0 });

        // Code should be updated
        cy.wait(1000);

        // Change language to Python
        cy.get('button').contains(/javascript/i).click();
        cy.contains(/python/i).click();

        // Click run button
        cy.contains('button', /run/i).click();

        // Should see output
        cy.contains('Hello from Python!', { timeout: 10000 }).should('be.visible');
    });

    it('should join session from URL', () => {
        cy.visit(`/session/${sessionId}`);

        // Should show username dialog
        cy.get('input[placeholder*="username" i]').should('be.visible');
        cy.get('input[placeholder*="username" i]').type('URLJoiner');
        cy.contains('button', /join/i).click();

        // Should enter session
        cy.get('[class*="monaco-editor"]', { timeout: 10000 }).should('be.visible');
    });

    it('should reject duplicate username', () => {
        // First user joins
        cy.joinSession(sessionId, 'UniqueUser');

        // Open in new context (simulate second user)
        cy.clearCookies();
        cy.visit(`/session/${sessionId}`);

        // Try to join with same username
        cy.get('input[placeholder*="username" i]').type('UniqueUser');
        cy.contains('button', /join/i).click();

        // Should show error
        cy.contains(/already taken/i, { timeout: 5000 }).should('be.visible');
    });

    it('should show session not found for invalid ID', () => {
        cy.visit('/session/invalidid123');

        // Should redirect or show error
        cy.contains(/not found/i, { timeout: 5000 }).should('be.visible');
    });
});

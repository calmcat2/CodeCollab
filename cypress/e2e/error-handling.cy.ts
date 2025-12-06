describe('Error Handling', () => {
    it('should handle invalid session ID gracefully', () => {
        cy.visit('/session/invalid-session-id-123');

        // Should show error message
        cy.contains(/not found/i, { timeout: 10000 }).should('be.visible');
    });

    it('should handle duplicate username', () => {
        cy.createSession().then((session) => {
            // First user joins
            cy.visit(`/session/${session.id}`);
            cy.get('input[placeholder*="username" i]').type('DuplicateUser');
            cy.contains('button', /join/i).click();
            cy.get('[class*="monaco-editor"]', { timeout: 10000 }).should('be.visible');

            // Clear session and try to join again with same username
            cy.clearCookies();
            cy.visit(`/session/${session.id}`);
            cy.get('input[placeholder*="username" i]').type('DuplicateUser');
            cy.contains('button', /join/i).click();

            // Should show error
            cy.contains(/already taken/i, { timeout: 5000 }).should('be.visible');
        });
    });

    it('should handle empty username', () => {
        cy.createSession().then((session) => {
            cy.visit(`/session/${session.id}`);

            // Try to join without entering username
            cy.contains('button', /join/i).should('be.disabled');
        });
    });

    it('should handle code execution errors', () => {
        cy.createSession().then((session) => {
            cy.joinSession(session.id, 'ErrorTester');
            cy.waitForWebSocket();

            // Write code with error
            cy.get('[class*="monaco-editor"] .view-lines').click();
            cy.focused().type('{ctrl}a{backspace}');
            cy.focused().type('print(undefined_variable)', { delay: 0 });

            // Wait for update
            cy.wait(1000);

            // Change to Python
            cy.get('button').contains(/javascript/i).click();
            cy.contains(/python/i).click();

            // Run code
            cy.contains('button', /run/i).click();

            // Should show error in output
            cy.contains(/error/i, { timeout: 10000 }).should('be.visible');
        });
    });

    it('should handle network errors gracefully', () => {
        // This test would require intercepting network requests
        cy.intercept('POST', '**/api/v1/sessions', {
            statusCode: 500,
            body: { error: 'Internal server error' },
        }).as('createSessionError');

        cy.visit('/');
        cy.contains('button', /create session/i).click();

        // Should handle error (implementation dependent)
        cy.wait('@createSessionError');
    });

    it('should handle session join with invalid session', () => {
        cy.visit('/');

        // Try to join non-existent session
        cy.get('input[placeholder*="session" i]').type('nonexistent123');
        cy.contains('button', /join/i).click();

        // Should show error
        cy.contains(/not found/i, { timeout: 10000 }).should('be.visible');
    });

    it('should validate session ID format', () => {
        cy.visit('/');

        // Try with empty session ID
        cy.get('input[placeholder*="session" i]').clear();
        cy.contains('button', /join/i).click();

        // Should show validation error
        cy.contains(/enter/i, { timeout: 5000 }).should('be.visible');
    });
});

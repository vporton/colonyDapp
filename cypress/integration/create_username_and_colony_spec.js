describe('Can create a username and colony in dev mode', () => {
  it('The /connect page contains a TrufflePig button', () => {
    cy.visit('/connect');
    cy.contains('TrufflePig').click();
  });

  it('TrufflePig button shows a go to colony button which loads dashboard', () => {
    cy.contains('Go to Colony').click();
    cy.url({ timeout: 60000 }).should('include', '/dashboard');
  });

  it('The dashboard contains an avatar dropdown', () => {
    cy.get('[data-test="avatarDropdown"]').click();
  });

  it('The avatar dropdown and username wizard let you register a username', () => {
    cy.contains('Get started').click();
    cy.get('[name="username"]').type('littlePiggie');
    cy.contains('Confirm').click();
  });
  it('The avatar dropdown and colony creation wizard create a colony', () => {
    cy.get('[data-test="avatarDropdown"]').click();
    cy.get('[href="/create-colony"]').click();
    cy.get('[name="colonyName"]').type('littlePiggieHouse');
    cy.contains('Next').click();
    cy.contains('Create a new token').click();
    cy.get('[name="tokenName"]').type('PigsAreNotBacon');
    cy.get('[name="tokenSymbol"]').type('PIG');
    cy.contains('Create Token', { timeout: 200000 }).click();
    cy.contains('Create Colony', { timeout: 20000 }).click();
    cy.get('[name="ensName"]', { timeout: 20000 }).type('Piglet');
    cy.contains('Done').click();
    // After the colony label is registered, the spinner stops and the Done text reappears
    cy.contains('Done', { timeout: 20000 });
  });
});

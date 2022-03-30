import Decimal from 'decimal.js';
import { bigNumberify } from 'ethers/utils';
import ganacheAccounts from '~lib/colonyNetwork/ganache-accounts.json';

import { splitAddress } from '~utils/strings';
import { createAddress } from '~utils/web3';

describe('User can create actions via UAC', () => {
  it('Can mint native tokens', () => {
    const amountToMint = 10;
    const annotationText = 'Test annotation';

    cy.login();

    cy.visit(`/colony/${Cypress.config().colony.name}`);

    cy.getBySel('colonyTotalFunds', { timeout: 60000 })
      .invoke('text')
      .as('totalFunds');

    cy.contains(/new action/i, { timeout: 60000 }).click();
    // needs to include 2 expressions, otherwise it will try opeining the link from the home page
    cy.contains(/manage funds/i && /the tools/i).click();
    cy.findByText(/mint tokens/i).click();

    cy.get('input')
      .click()
      .type(amountToMint)
      .get('textarea')
      .click()
      .type(annotationText);

    cy.contains(/confirm/i).click();
    cy.url().should(
      'contains',
      `${Cypress.config().baseUrl}/colony/${
        Cypress.config().colony.name
      }/tx/0x`,
      { timeout: 20000 },
    );

    cy.getBySel('actionHeading').should(
      'have.text',
      `Mint ${amountToMint} ${Cypress.config().colony.nativeToken}`,
    );
    cy.getBySel('comment').should('have.text', annotationText);

    cy.getBySel('backButton').click();

    cy.get('@totalFunds').then(($totalFunds) => {
      const totalFunds = bigNumberify($totalFunds.split(',').join(''))
        .add(amountToMint)
        .toString();

      cy.getBySel('colonyTotalFunds', { timeout: 15000 }).then(($text) => {
        const text = $text.text().split(',').join('');
        expect(text).to.eq(totalFunds);
      });
    });
  });
  it('Can make payment', () => {
    const amountToPay = 10;
    const annotationText = 'Test annotation';
    const accounts = Object.entries(ganacheAccounts.private_keys).map(
      ([address]) => address,
    );
    const cutAddress = splitAddress(createAddress(accounts[1]));
    const paidAmount = new Decimal(amountToPay).sub(
      new Decimal(1.0001).div(100).mul(amountToPay),
    );
    let prevColonyFunds;

    cy.login();

    cy.visit(`/colony/${Cypress.config().colony.name}`);

    cy.getBySel('colonyTotalFunds', { timeout: 30000 }).then(($text) => {
      const amount = $text.text().split(',').join('');
      prevColonyFunds = amount;
    });

    cy.getBySel('newActionButton', { timeout: 60000 }).click();
    cy.getBySel('expenditureDialogIndexItem').click();
    cy.getBySel('paymentDialogIndexItem').click();

    cy.getBySel('paymentRecipientPicker').click().type(accounts[1]);
    cy.getBySel('paymentRecipientItem').first().click();

    cy.getBySel('paymentAmountInput').click().type(amountToPay);

    cy.getBySel('paymentAnnotation').click().type(annotationText);
    cy.getBySel('paymentConfirmButton').click();

    cy.getBySel('actionHeading', { timeout: 70000 }).should(
      'have.text',
      `Pay ${cutAddress.header}${cutAddress.start}...${
        cutAddress.end
      } ${paidAmount.toString()} ${Cypress.config().colony.nativeToken}`,
    );

    cy.url().should(
      'contains',
      `${Cypress.config().baseUrl}/colony/${
        Cypress.config().colony.name
      }/tx/0x`,
    );

    cy.getBySel('comment').should('have.text', annotationText);

    cy.getBySel('backButton').click();

    cy.getBySel('colonyTotalFunds', { timeout: 15000 }).then(($text) => {
      const amount = $text.text().split(',').join('');
      expect(amount).to.eq((prevColonyFunds - amountToPay).toString());
    });
  });
  it('Can create teams', () => {
    const annotationText = 'Test annotation';
    const domainName = 'Cats';
    const domainPurpose = 'Only cats allowed';

    cy.login();

    cy.visit(`/colony/${Cypress.config().colony.name}`);

    cy.getBySel('newActionButton', { timeout: 60000 }).click();
    cy.getBySel('domainsDialogIndexItem').click();
    cy.getBySel('createDomainDialogIndexItem').click();

    cy.getBySel('domainNameInput').click().type(domainName);
    cy.getBySel('domainPurposeInput').click().type(domainPurpose);
    cy.getBySel('createDomainAnnotation').click().type(annotationText);

    cy.getBySel('createDomainConfirmButton').click();

    cy.getBySel('actionHeading', { timeout: 70000 }).should(
      'have.text',
      `New team: ${domainName}`,
    );

    cy.url().should(
      'contains',
      `${Cypress.config().baseUrl}/colony/${
        Cypress.config().colony.name
      }/tx/0x`,
    );

    cy.getBySel('comment').should('have.text', annotationText);

    cy.getBySel('backButton').click();

    cy.getBySel('colonyDomainSelector', { timeout: 15000 }).click();
    cy.getBySel('domainDropdownItemName')
      .last()
      .should('have.text', domainName);
    cy.getBySel('domainDropdownItemPurpose')
      .last()
      .should('have.text', domainPurpose);
  });
  it('Can edit teams', () => {
    const annotationText = 'Test annotation';
    const domainName = 'Dolphins';
    const domainPurpose = 'This team has been taken over by dolphins';

    cy.login();

    cy.visit(`/colony/${Cypress.config().colony.name}`);

    cy.getBySel('newActionButton', { timeout: 90000 }).click();
    cy.getBySel('domainsDialogIndexItem').click();
    cy.getBySel('editDomainDialogIndexItem').click();

    cy.getBySel('domainIdSelector').click();
    cy.getBySel('domainIdItem').last().click();
    cy.getBySel('domainNameInput').clear();
    cy.getBySel('domainNameInput').click().type(domainName);
    cy.getBySel('domainPurposeInput').clear();
    cy.getBySel('domainPurposeInput').click().type(domainPurpose);
    cy.getBySel('editDomainAnnotation').click().type(annotationText);

    cy.getBySel('editDomainConfirmButton').click();

    cy.getBySel('actionHeading', { timeout: 100000 }).should(
      'have.text',
      `${domainName} team details edited`,
    );

    cy.url().should(
      'contains',
      `${Cypress.config().baseUrl}/colony/${
        Cypress.config().colony.name
      }/tx/0x`,
    );

    cy.getBySel('comment').should('have.text', annotationText);

    cy.getBySel('backButton').click();

    cy.getBySel('colonyDomainSelector', { timeout: 15000 }).click();
    cy.getBySel('domainDropdownItemName')
      .last()
      .should('have.text', domainName);
    cy.getBySel('domainDropdownItemPurpose')
      .last()
      .should('have.text', domainPurpose);
  });
  it('Can award users', () => {
    const amountToAward = 10;
    const annotationText = 'You have been a good boy, time for your reward';
    let rewardedUser;

    cy.login();

    cy.visit(`/colony/${Cypress.config().colony.name}`);

    cy.getBySel('newActionButton', { timeout: 90000 }).click();
    cy.getBySel('reputationDialogIndexItem').click();
    cy.getBySel('awardReputationDialogIndexItem').click();

    cy.getBySel('reputationRecipientSelector').click({ force: true });
    cy.getBySel('reputationRecipientSelectorItem').last().click();
    cy.getBySel('reputationRecipientName').then(($value) => {
      rewardedUser = $value.text();
    });
    cy.getBySel('reputationAmountInput').click().type(amountToAward);

    cy.getBySel('reputationAnnotation').click().type(annotationText);

    cy.getBySel('reputationConfirmButton').click();

    cy.getBySel('actionHeading', { timeout: 100000 }).then(($value) => {
      expect($value.text()).to.eq(
        `Award ${rewardedUser} with a ${amountToAward} pts reputation reward`,
      );
    });

    cy.url().should(
      'contains',
      `${Cypress.config().baseUrl}/colony/${
        Cypress.config().colony.name
      }/tx/0x`,
    );

    cy.getBySel('comment').should('have.text', annotationText);
  });
  it('Can smite users', () => {
    const amountToSmite = 10;
    const annotationText =
      'You have been a naughty boy, time for your punishment';
    let smoteUser;

    cy.login();

    cy.visit(`/colony/${Cypress.config().colony.name}`);

    cy.getBySel('newActionButton', { timeout: 90000 }).click();
    cy.getBySel('reputationDialogIndexItem').click();
    cy.getBySel('smiteReputationDialogIndexItem').click();

    cy.getBySel('reputationRecipientSelector').click({ force: true });
    cy.getBySel('reputationRecipientSelectorItem').last().click();
    cy.getBySel('reputationRecipientName').then(($value) => {
      smoteUser = $value.text();
    });
    cy.getBySel('reputationAmountInput').click().type(amountToSmite);

    cy.getBySel('reputationAnnotation').click().type(annotationText);

    cy.getBySel('reputationConfirmButton').click();

    cy.getBySel('actionHeading', { timeout: 100000 }).then(($value) => {
      expect($value.text()).to.eq(
        `Smite ${smoteUser} with a ${amountToSmite} pts reputation penalty`,
      );
    });

    cy.url().should(
      'contains',
      `${Cypress.config().baseUrl}/colony/${
        Cypress.config().colony.name
      }/tx/0x`,
    );

    cy.getBySel('comment').should('have.text', annotationText);
  });
  it.only('Can transfer funds', () => {
    const amountToTransfer = 2;
    const annotationText = 'I want to transfer these funds just because';
    let prevColonyFunds;

    cy.login();

    cy.visit(`/colony/${Cypress.config().colony.name}`);

    cy.getBySel('colonyDomainSelector', { timeout: 90000 }).click();
    cy.getBySel('colonyDomainSelectorItem').last().click();
    cy.getBySel('colonyFundingNativeTokenValue').then(($text) => {
      prevColonyFunds = $text.text().split(',').join('');
    });

    cy.getBySel('newActionButton', { timeout: 90000 }).click();
    cy.getBySel('fundsDialogIndexItem').click();
    cy.getBySel('transferFundsDialogIndexItem').click();

    cy.getBySel('domainIdSelector').first().click();
    cy.getBySel('domainIdItem').first().click();

    cy.getBySel('domainIdSelector').last().click();
    cy.getBySel('domainIdItem').last().click();

    cy.getBySel('transferAmountInput').click().type(amountToTransfer);

    cy.getBySel('transferFundsAnnotation').click().type(annotationText);

    cy.getBySel('transferFundsConfirmButton').click();

    cy.getBySel('actionHeading', { timeout: 100000 }).should(
      'include.text',
      `Move ${amountToTransfer} ${
        Cypress.config().colony.nativeToken
      } from Root to `,
    );

    cy.url().should(
      'contains',
      `${Cypress.config().baseUrl}/colony/${
        Cypress.config().colony.name
      }/tx/0x`,
    );

    cy.getBySel('comment').should('have.text', annotationText);

    cy.getBySel('backButton').click();

    cy.getBySel('colonyDomainSelector', { timeout: 15000 }).click();
    cy.getBySel('colonyDomainSelectorItem').last().click();
    cy.getBySel('colonyFundingNativeTokenValue').then(($text) => {
      const amount = $text.text().split(',').join('');
      expect(amount).to.eq(
        (parseInt(prevColonyFunds, 10) + amountToTransfer).toString(),
      );
    });
  });
});

import { getHarness } from '@jscutlery/cypress-harness'
import { PageHeaderHarness } from '@onecx/angular-accelerator/testing'

describe('module spec', () => {
  const harness = getHarness(PageHeaderHarness)

  let SHELL_ADDRESS
  let KEYCLOAK_ADDRESS
  beforeEach(() => {
    // SHELL_ADDRESS = Cypress.env('SHELL_ADDRESS')
    // KEYCLOAK_ADDRESS = Cypress.env('KEYCLOAK_ADDRESS')
    SHELL_ADDRESS = 'onecx-shell-ui:8080'
    KEYCLOAK_ADDRESS = 'keycloak-app:8080'
  })
  it('passes', () => {
    cy.visit('https://example.cypress.io')
  })

  // TODO: Offer login functionality for products out of the box
  it('renders the page', () => {
    cy.visit(`http://${SHELL_ADDRESS}/onecx-shell/admin/workspace`)

    // cy.url({ timeout: 10000 }).should('include', `${KEYCLOAK_ADDRESS}`)
    cy.origin(`http://${KEYCLOAK_ADDRESS}`, { args: { KEYCLOAK_ADDRESS } }, ({ KEYCLOAK_ADDRESS }) => {
      cy.url().should('include', `${KEYCLOAK_ADDRESS}`)
      cy.get('input[name="username"]').type('onecx')
      cy.get('input[name="password"]').type('onecx')
      cy.get('input[name="login"]').click()
    })

    cy.url().should('include', `${SHELL_ADDRESS}`)

    cy.title().should('eq', 'my page changed')
  })

  it('should use harness', () => {
    cy.visit(`http://${SHELL_ADDRESS}/onecx-shell/admin/workspace`)

    // cy.url({ timeout: 10000 }).should('include', `${KEYCLOAK_ADDRESS}`)
    cy.origin(`http://${KEYCLOAK_ADDRESS}`, { args: { KEYCLOAK_ADDRESS } }, ({ KEYCLOAK_ADDRESS }) => {
      cy.url().should('include', `${KEYCLOAK_ADDRESS}`)
      cy.get('input[name="username"]').type('onecx')
      cy.get('input[name="password"]').type('onecx')
      cy.get('input[name="login"]').click()
    })

    cy.url().should('include', `${SHELL_ADDRESS}`)

    harness.getHeaderText().should('equal', 'Workspace Management')
    harness.getSubheaderText().should('equal', 'wrong subheader text value')
  })

  it('should fail', () => {
    expect(true).to.equal(false)
  })
})

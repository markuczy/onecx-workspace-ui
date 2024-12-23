describe('module spec', () => {
  let SHELL_ADDRESS
  let KEYCLOAK_ADDRESS
  beforeEach(() => {
    // SHELL_ADDRESS = Cypress.env('SHELL_ADDRESS')
    // KEYCLOAK_ADDRESS = Cypress.env('KEYCLOAK_ADDRESS')
    SHELL_ADDRESS = 'local-proxy:8080'
    KEYCLOAK_ADDRESS = 'keycloak-app:8080'
  })
  it('passes', () => {
    cy.visit('https://example.cypress.io')
  })

  // TODO: Offer login functionality for products out of the box
  // TODO: Write real assertion to check for the module loading
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

    cy.title().should('eq', 'my page hihi')
  })

  it('should fail', () => {
    expect(true).to.equal(false)
  })
})

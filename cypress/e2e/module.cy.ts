describe('module spec', () => {
  let port: number
  let keycloakPort: number
  beforeEach(() => {
    port = Cypress.env('PORT')
    keycloakPort = Cypress.env('KEYCLOAK_PORT')
  })
  it('passes', () => {
    cy.visit('https://example.cypress.io')
  })

  // TODO: Offer login functionality for products out of the box
  // TODO: Write real assertion to check for the module loading
  it('renders the page', () => {
    cy.visit(`http://localhost:${port}/onecx-shell/admin/tenant`)

    cy.url().should('include', `localhost:${keycloakPort}`)

    cy.get('input[name="username"]').type('onecx')
    cy.get('input[name="password"]').type('onecx')
    cy.get('input[name="login"]').click()

    cy.url().should('include', `localhost:${port}`)

    cy.title().should('eq', 'my page hihi')
  })

  it('should fail', () => {
    expect(true).to.equal(false)
  })
})

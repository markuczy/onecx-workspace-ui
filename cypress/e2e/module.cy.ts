describe('module spec', () => {
  it('passes', () => {
    cy.visit('https://example.cypress.io')
  })

  // TODO: Make the url as parameter
  // TODO: Offer login functionality for products out of the box
  // TODO: Write real assertion to check for the module loading
  it('renders the page', () => {
    cy.visit('http://local-proxy/onecx-shell/admin/tenant')

    cy.origin('http://keycloak-app', () => {
      cy.title().should('eq', 'Sign in to onecx')
    })
  })

  it('should fail', () => {
    expect(true).to.equal(false)
  })
})

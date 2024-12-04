describe('module spec', () => {
  it('renders the page', () => {
    cy.visit('http://local-proxy/onecx-shell/admin/tenant')

    cy.title().should('eq', 'My awesome title')
  })
})
// Sign in to onecx

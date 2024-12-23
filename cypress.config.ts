import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    supportFile: false,
    specPattern: 'e2e-tests/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}'
  },
  screenshotsFolder: 'e2e-tests/cypress/screenshots'
})

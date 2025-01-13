import { defineConfig } from 'cypress'

import { getPreprocessorConfig } from '@jscutlery/cypress-harness/preprocessor-config'

export default defineConfig({
  e2e: {
    supportFile: 'e2e-tests/cypress/support/index.js',
    specPattern: 'e2e-tests/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    ...getPreprocessorConfig()
  },
  screenshotsFolder: 'e2e-tests/cypress/screenshots'
})

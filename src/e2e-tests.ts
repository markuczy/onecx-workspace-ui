import { GenericContainer, StartedNetwork, StartedTestContainer } from 'testcontainers'
import * as path from 'path'
import * as fs from 'fs'
import { exit } from 'process'
import { OneCXEnvironment } from './e2e-lib/core/onecx-base-environment'
import { OneCXWorkspaceBffContainer } from './e2e-lib/apps/onecx-workspace-bff'
import { OneCXWorkspaceUiContainer } from './e2e-lib/apps/onecx-workspace-ui'
import { containerImagesEnv } from './e2e-lib/constants/e2e-config'
import { exec } from 'child_process'
import { ContainerStartError } from './e2e-lib/model/container-start-error'
import { StartedOneCXKeycloakContainer } from './e2e-lib/core/onecx-keycloak'

// // depends on themeSvc
// const themeBffContainer = await new OneCXThemeBffContainer(containerImagesEnv.ONECX_THEME_BFF, network).start()

// // depends on workspaceSvc
// const workspaceBffContainer = await new OneCXWorkspaceBffContainer(
//   containerImagesEnv.ONECX_WORKSPACE_BFF,
//   network
// ).start()

// // depends on permissionSvc
// const permissionBffContainer = await new OneCXPermissionBffContainer(
//   containerImagesEnv.ONECX_PERMISSION_BFF,
//   network
// ).start()

// // depends on productStoreSvc
// const productStoreBffContainer = await new OneCXProductStoreBffContainer(
//   containerImagesEnv.ONECX_PRODUCT_STORE_BFF,
//   network
// ).start()

// // depends on userProfileSvc
// const userProfileBffContainer = await new OneCXUserProfileBffContainer(
//   containerImagesEnv.ONECX_USER_PROFILE_BFF,
//   network
// ).start()

// // depends on iamSvc
// const iamBffContainer = await new OneCXIamBffContainer(containerImagesEnv.ONECX_IAM_BFF, network).start()

// // depends on tenantSvc
// const tenantBffContainer = await new OneCXTenantBffContainer(containerImagesEnv.ONECX_TENANT_BFF, network).start()

// // depends on themeBff
// const themeUiContainer = await new OneCXThemeUiContainer(containerImagesEnv.ONECX_THEME_UI, network).start()

// // depends on workspaceBff
// const workspaceUiContainer = await new OneCXWorkspaceUiContainer(
//   containerImagesEnv.ONECX_WORKSPACE_UI,
//   network
// ).start()

// // depends on permissionUi
// const permissionUiContainer = await new OneCXPermissionUiContainer(
//   containerImagesEnv.ONECX_PERMISSION_UI,
//   network
// ).start()

// // depends on productStoreUi
// const productStoreUiContainer = await new OneCXProductStoreUiContainer(
//   containerImagesEnv.ONECX_PRODUCT_STORE_UI,
//   network
// ).start()

// // depends on userProfileUi
// const userProfileUiContainer = await new OneCXUserProfileUiContainer(
//   containerImagesEnv.ONECX_USER_PROFILE_UI,
//   network
// ).start()

// // depends on iamUi
// const iamUiContainer = await new OneCXIamUiContainer(containerImagesEnv.ONECX_IAM_UI, network).start()

// // depends on tenantUi
// const tenantUiContainer = await new OneCXTenantUiContainer(containerImagesEnv.ONECX_TENANT_UI, network).start()

// TODO: copy essential files only
async function setupCypressContainer(network: StartedNetwork) {
  const cypressContainer = await new GenericContainer('cypress/included:13.17.0')
    .withEntrypoint(['tail', '-f', '/dev/null'])
    .withWorkingDir('/e2e')
    .withNetwork(network)
    .withCopyDirectoriesToContainer([
      {
        source: path.resolve('./'),
        target: '/e2e'
      }
    ])
    .withLogConsumer((stream) => {
      stream.on('data', (line) => console.log(`Cypress: `, line))
      stream.on('err', (line) => console.error(`Cypress: `, line))
      stream.on('end', () => console.log(`Cypress: Stream closed`))
    })
    .start()

  return cypressContainer
}

function setupWorkspaceBff(network: StartedNetwork, keycloakContainer: StartedOneCXKeycloakContainer) {
  return new OneCXWorkspaceBffContainer(containerImagesEnv.ONECX_WORKSPACE_BFF, {
    network,
    keycloakContainer
  })
}

function setupWorkspaceUi(network: StartedNetwork, keycloakContainer: StartedOneCXKeycloakContainer) {
  return new OneCXWorkspaceUiContainer(containerImagesEnv.ONECX_WORKSPACE_UI, { network, keycloakContainer })
}

async function runTests() {
  // let oneCXEnv: OneCXEnvironment = new OneCXEnvironment().withOneCXNameAndAliasPrefix('workspace-e2e')
  let oneCXEnv: OneCXEnvironment = new OneCXEnvironment()
  try {
    // Prepare core containers and network
    oneCXEnv = await oneCXEnv.startNetwork()
    oneCXEnv = await oneCXEnv.startDatabase()
    oneCXEnv = await oneCXEnv.startKeycloak()
  } catch (e) {
    if (e instanceof ContainerStartError) {
      console.error(`Error while starting core environment and network: ${e.message}. Caused by: ${e.cause}`)
    }
    exit(1)
  }

  const network = oneCXEnv.getOneCXNetwork()
  const db = oneCXEnv.getOneCXDatabase()
  const keycloak = oneCXEnv.getOneCXKeycloak()
  if (!network) {
    console.error('Network is not started.')
    exit(1)
  }
  if (!db) {
    console.error('Database is not started.')
    exit(1)
  }
  if (!keycloak) {
    console.error('Keycloak is not started.')
    exit(1)
  }

  // Prepare environment with extended services definitions
  const workspaceBff = setupWorkspaceBff(network, keycloak)
  const workspaceUi = setupWorkspaceUi(network, keycloak)

  try {
    // Prepare applications
    oneCXEnv = oneCXEnv.withOneCXBff(workspaceBff).withOneCXUi(workspaceUi)
    oneCXEnv = await oneCXEnv.startApplications()
  } catch (e) {
    if (e instanceof ContainerStartError) {
      console.error(`Error while starting applications: ${e.message}. Caused by: ${e.cause}`)
    }
    exit(1)
  }

  // Ensure Shell UI is running
  const shellUiContainer = oneCXEnv.getOneCXShellUi()
  if (!shellUiContainer) {
    console.error('Shell UI is not defined.')
    await oneCXEnv.teardown()
    exit(1)
  }

  // Setup cypress container and run the tests
  let testResult: 'success' | 'fail' = 'success'
  console.log('starting e2e tests')
  let cypressContainer: StartedTestContainer | undefined
  try {
    cypressContainer = await setupCypressContainer(network)
    const testExec = await cypressContainer.exec([
      'cypress',
      'run',
      '--env',
      `SHELL_ADDRESS=${shellUiContainer.getOneCXAlias()}:${shellUiContainer.getOneCXExposedPort()},KEYCLOAK_ADDRESS=${keycloak.getOneCXAlias()}:${keycloak.getOneCXExposedPort()}`
    ])

    if (testExec.exitCode != 0) testResult = 'fail'

    console.log(`TESTS stdout: ${testExec.stdout}`)

    console.log('finishing e2e tests')
  } catch (error) {
    console.error('Cypress tests failed', error)
  } finally {
    // Save screenshots if cypress container is accessible
    if (cypressContainer) {
      const screenshootsStream = await cypressContainer.copyArchiveFromContainer('/e2e/e2e-tests/cypress/screenshots')
      const filePath = path.join(path.resolve('./'), 'e2e-tests/cypress/screenshots.tar')
      const writeableStream = fs.createWriteStream(filePath)
      screenshootsStream.pipe(writeableStream)
      writeableStream.on('finish', () => {
        exec(
          `tar -xf e2e-tests/cypress/screenshots.tar -C e2e-tests/cypress/container-screenshots/; rm -rf e2e-tests/cypress/screenshots.tar`,
          (error, stdout, stderr) => {
            if (error) {
              console.error(`Error unzipping screenshots: ${error.message}`)
              console.error(`Error unzipping output:\n${stdout}`)
            }
            console.log(`Unzip import output:\n${stdout}`)
            if (stderr) {
              console.error(`Unzip errors:\n${stderr}`)
            }
          }
        )
        console.log('Screenshots has been written successfully.')
      })
      writeableStream.on('error', (err) => {
        console.error('Error writing file:', err)
      })
      await new Promise((r) => setTimeout(r, 5_000))
      await cypressContainer.stop()
      console.log('Cypress container stopped')
    }
    // Cleanup environment
    await oneCXEnv.teardown()
  }

  exit(testResult === 'success' ? 0 : 1)
}

runTests().catch((err) => console.error(err))

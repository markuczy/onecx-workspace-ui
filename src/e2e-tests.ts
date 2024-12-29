import { GenericContainer, Network, StartedNetwork, StartedTestContainer } from 'testcontainers'
import * as path from 'path'
import * as fs from 'fs'
import { exit } from 'process'
import { OneCXBaseEnvironment, StartedOneCXBaseEnvironment } from './e2e-lib/core/onecx-base-environment'
import { OneCXWorkspaceBffContainer } from './e2e-lib/apps/onecx-workspace-bff'
import { OneCXWorkspaceUiContainer } from './e2e-lib/apps/onecx-workspace-ui'
import { containerImagesEnv } from './e2e-lib/constants/e2e-config'
import { exec } from 'child_process'
import { ContainerStartError } from './e2e-lib/model/container-start-error'

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

function setupWorkspaceBff(network: StartedNetwork) {
  return new OneCXWorkspaceBffContainer(containerImagesEnv.ONECX_WORKSPACE_BFF, network)
}

function setupWorkspaceUi(network: StartedNetwork) {
  return new OneCXWorkspaceUiContainer(containerImagesEnv.ONECX_WORKSPACE_UI, network)
}

async function runTests() {
  const network = await new Network().start()
  if (!network) {
    console.error('Network set up failed')
    exit(1)
  }

  const workspaceBff = setupWorkspaceBff(network)
  const workspaceUi = setupWorkspaceUi(network)

  let oneCXBaseEnv: StartedOneCXBaseEnvironment
  try {
    oneCXBaseEnv = await new OneCXBaseEnvironment({})
      .withOneCXNetwork(network)
      .withOneCXBff(workspaceBff)
      .withOneCXUi(workspaceUi)
      .start()
  } catch (e) {
    if (e instanceof ContainerStartError) {
      console.error(`Error while creating base environment: ${e.message}. Caused by: ${e.cause}`)
    }
    exit(1)
  }

  const shellUiContainer = oneCXBaseEnv.getOneCXShellUi()
  if (!shellUiContainer) {
    console.error('Shell UI is not defined.')
    await oneCXBaseEnv.teardown()
    exit(1)
  }

  let testResult: 'success' | 'fail' = 'success'
  console.log('starting e2e tests')
  let cypressContainer: StartedTestContainer | undefined
  try {
    cypressContainer = await setupCypressContainer(oneCXBaseEnv.getOneCXNetwork())
    const testExec = await cypressContainer.exec([
      'cypress',
      'run',
      '--env',
      `SHELL_ADDRESS=${shellUiContainer.getOneCXAlias()}:${shellUiContainer.getOneCXExposedPort()},KEYCLOAK_ADDRESS=${oneCXBaseEnv.getOneCXKeycloak().getOneCXAlias()}:${oneCXBaseEnv.getOneCXKeycloak().getOneCXExposedPort()}`
    ])

    if (testExec.exitCode != 0) testResult = 'fail'

    // console.log(`TESTS stdout: ${testExec.stdout}`)
    // console.log(`TESTS exitCode: ${testExec.exitCode}`)
    // console.log(`TESTS stderr: ${testExec.stderr}`)
    // console.log(`TESTS output: ${testExec.output}`)

    console.log('finishing e2e tests')
  } catch (error) {
    console.error('Cypress tests failed', error)
  } finally {
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
    await oneCXBaseEnv.teardown()
  }

  exit(testResult === 'success' ? 0 : 1)
}

runTests().catch((err) => console.error(err))

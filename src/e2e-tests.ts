import { GenericContainer, StartedNetwork, StartedTestContainer, Network } from 'testcontainers'
import * as path from 'path'
import * as fs from 'fs'
import { exit } from 'process'
import { OneCXEnvironment, StartedOneCXEnvironment } from './e2e-lib/core/onecx-base-environment'
import { containerImagesEnv } from './e2e-lib/constants/e2e-config'
import { exec } from 'child_process'
import { ContainerStartError } from './e2e-lib/model/container-start-error'
import { OneCXWorkspaceSvcContainer } from './e2e-lib/apps/onecx-workspace-svc'
import { OneCXShellUiContainer } from './e2e-lib/apps/onecx-shell-ui'
import { OneCXThemeSvcContainer } from './e2e-lib/apps/onecx-theme-svc'
import { OneCXExtendedSetup } from './e2e-lib/core/onecx-setup'
import { OneCXCoreApplications } from './e2e-lib/model/onecx-application-type'
import { OneCXBaseRunner } from './e2e-lib/core/onecx-runner'

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

async function runTests() {
  const network = await new Network().start()
  const applicationList = [
    [OneCXCoreApplications.WORKSPACE],
    [OneCXCoreApplications.TENANT, OneCXCoreApplications.THEME]
  ]
  let oneCXEnv: OneCXEnvironment = new OneCXEnvironment(
    network,
    new OneCXExtendedSetup(network, {
      extension: 'partial',
      applicationList: applicationList.flat(),
      namePrefix: 'e2e_workspace_'
    }),
    new OneCXBaseRunner()
  )
  let startedOneCXEnv: StartedOneCXEnvironment
  try {
    startedOneCXEnv = await oneCXEnv
      // .withOneCXBff(
      //   new OneCXWorkspaceBffContainer(containerImagesEnv.ONECX_WORKSPACE_BFF, {
      //     network: oneCXEnv.getOneCXNetwork(),
      //     keycloakContainer: oneCXEnv.getOneCXKeycloak()
      //   })
      // )
      // .withOneCXUi(
      //   new OneCXWorkspaceUiContainer(containerImagesEnv.ONECX_WORKSPACE_UI, {
      //     network: oneCXEnv.getOneCXNetwork(),
      //     keycloakContainer: oneCXEnv.getOneCXKeycloak()
      //   })
      // )
      .withOneCXService(
        new OneCXWorkspaceSvcContainer(containerImagesEnv.ONECX_WORKSPACE_SVC, {
          network: oneCXEnv.getOneCXNetwork(),
          keycloakContainer: oneCXEnv.getOneCXKeycloak(),
          databaseContainer: oneCXEnv.getOneCXDatabase()
        })
      )
      .withOneCXService(
        new OneCXThemeSvcContainer('ghcr.io/onecx/onecx-theme-svc:1.3.0', {
          network: oneCXEnv.getOneCXNetwork(),
          keycloakContainer: oneCXEnv.getOneCXKeycloak(),
          databaseContainer: oneCXEnv.getOneCXDatabase()
        })
      )
      .withOneCXUi(
        new OneCXShellUiContainer('ghcr.io/onecx/onecx-shell-ui:1.5.0', {
          network: oneCXEnv.getOneCXNetwork(),
          keycloakContainer: oneCXEnv.getOneCXKeycloak()
        })
      )
      .start({
        order: applicationList
      })
    await startedOneCXEnv.importData()
  } catch (e) {
    if (e instanceof ContainerStartError) {
      console.error(`Error while starting OneCX environment: ${e.message}. Caused by: ${e.cause}`)
    }
    exit(1)
  }

  // Ensure Shell UI is running
  const shellUiContainer = startedOneCXEnv.getOneCXShellUi()
  if (!shellUiContainer) {
    console.error('Shell UI is not defined.')
    await startedOneCXEnv.teardown()
    exit(1)
  }

  // Setup cypress container and run the tests
  let testResult: 'success' | 'fail' = 'success'
  console.log('starting e2e tests')
  let cypressContainer: StartedTestContainer | undefined
  try {
    cypressContainer = await setupCypressContainer(oneCXEnv.getOneCXNetwork())
    const testExec = await cypressContainer.exec([
      'cypress',
      'run',
      '--env',
      `SHELL_ADDRESS=${shellUiContainer.getOneCXAlias()}:${shellUiContainer.getOneCXExposedPort()},KEYCLOAK_ADDRESS=${oneCXEnv.getOneCXKeycloak().getOneCXAlias()}:${oneCXEnv.getOneCXKeycloak().getOneCXExposedPort()}`
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
    await startedOneCXEnv.teardown()
  }

  exit(testResult === 'success' ? 0 : 1)
}

runTests().catch((err) => console.error(err))

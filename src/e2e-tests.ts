import { GenericContainer, Network, StartedNetwork, StartedTestContainer } from 'testcontainers'
import * as path from 'path'
import * as fs from 'fs'
import { importDatabaseData } from './e2e-lib/utils/utils'
import { OneCXBaseEnvironment } from './e2e-lib/core/onecx-base-environment'

function log(message: string) {
  console.log(`SETUP: ${message}`)
}

async function setup() {
  log('starting e2e tests setup')

  // // depends on postgresDbContainer
  // const themeSvcContainer = await new OneCXThemeSvcContainer(containerImagesEnv.ONECX_THEME_SVC, network).start()

  // // depends on postgresDbContainer
  // const permissionSvcContainer = await new OneCXPermissionSvcContainer(
  //   containerImagesEnv.ONECX_PERMISSION_SVC,
  //   network
  // ).start()

  // // depends on postgresDbContainer
  // const productStoreSvcContainer = await new OneCXProductStoreSvcContainer(
  //   containerImagesEnv.ONECX_PRODUCT_STORE_SVC,
  //   network
  // ).start()

  // // depends on postgresDbContainer
  // const userProfileSvcContainer = await new OneCXUserProfileSvcContainer(
  //   containerImagesEnv.ONECX_USER_PROFILE_SVC,
  //   network
  // ).start()

  // // depends on postgresDbContainer
  // const iamKcSvcContainer = await new OneCXIamKcSvcContainer(containerImagesEnv.ONECX_IAM_KC_SVC, network).start()

  // // depends on postgresDbContainer
  // const tenantSvcContainer = await new OneCXTenantSvcContainer(containerImagesEnv.ONECX_TENANT_SVC, network).start()

  // // depends on postgresDbContainer
  // const workspaceSvcContainer = await new OneCXWorkspaceSvcContainer(
  //   containerImagesEnv.ONECX_WORKSPACE_SVC,
  //   network
  // ).start()

  // // depends on postgresDbContainer, themeSvcContainer, permission_svc, product_store_svc, user_profile_svc, iam_kc_svc, tenant_svc, workspace_svc
  // await importDatabaseData(
  //   {
  //     THEME_SVC_PORT: themeSvcContainer.getMappedPort(8080),
  //     PERMISSION_SVC_PORT: permissionSvcContainer.getMappedPort(8080),
  //     PRODUCT_STORE_SVC_PORT: productStoreSvcContainer.getMappedPort(8080),
  //     USER_PROFILE_SVC_PORT: userProfileSvcContainer.getMappedPort(8080),
  //     IAM_KC_SVC_PORT: iamKcSvcContainer.getMappedPort(8080),
  //     TENANT_SVC_PORT: tenantSvcContainer.getMappedPort(8080),
  //     WORKSPACE_SVC_PORT: workspaceSvcContainer.getMappedPort(8080)
  //   },
  //   path.resolve('e2e-tests/import-onecx.sh')
  // )

  // // depends on postgresDbContainer, themeSvcContainer, permission_svc, product_store_svc, user_profile_svc, iam_kc_svc, tenant_svc, workspace_svc
  // const shellBffContainer = await new OneCXShellBffContainer(containerImagesEnv.ONECX_SHELL_BFF, network).start()

  // // depends on keycloak, shell-bff
  // const shellUiContainer = await new OneCXShellUiContainer(containerImagesEnv.ONECX_SHELL_UI, network).start()

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

  console.log('finishing e2e tests setup')
  return {
    services: [
      // postgresDbContainer,
      // keycloakContainer,
      ...[
        // themeSvcContainer,
        // permissionSvcContainer,
        // productStoreSvcContainer,
        // userProfileSvcContainer,
        // iamKcSvcContainer,
        // tenantSvcContainer,
        // workspaceSvcContainer
      ],
      ...[
        // shellBffContainer,
        // themeBffContainer,
        // workspaceBffContainer,
        // permissionBffContainer,
        // productStoreBffContainer,
        // userProfileBffContainer,
        // iamBffContainer,
        // tenantBffContainer
      ],
      ...[
        // shellUiContainer,
        // themeUiContainer,
        // workspaceUiContainer,
        // permissionUiContainer,
        // productStoreUiContainer,
        // userProfileUiContainer,
        // iamUiContainer,
        // tenantUiContainer
      ]
      // network
    ]
    // uiContainer: shellUiContainer.getOneCXAlias(),
    // keycloakContainer: keycloakContainer.getOneCXAlias(),
    // network: network
  }
}

async function setupCypressContainer(network: StartedNetwork, shellContainer: string, keycloakContainer: string) {
  const cypressContainer = await new GenericContainer('cypress/included:13.17.0')
    // .withEntrypoint(['cypress', 'run'])
    // .withEntrypoint(['ls', '-al'])
    // .withEnvironment({
    //   PORT: String(uiPort),
    //   KEYCLOAK_PORT: String(keycloakPort)
    // })
    .withWorkingDir('/e2e')
    // .withName('cypressTestsContainer')
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
  // return new Promise((resolve, reject) => {
  //   exec(
  //     `npx cypress run --spec "cypress/e2e/**/*.cy.ts" --env PORT=${uiPort},KEYCLOAK_PORT=${keycloakPort}`,
  //     (error, stdout, stderr) => {
  //       if (error) {
  //         console.error(`Error running Cypress tests: ${error.message}`)
  //         console.error(`Error tests output:\n${stdout}`)
  //         return reject(error)
  //       }
  //       console.log(`Cypress tests output:\n${stdout}`)
  //       if (stderr) {
  //         console.error(`Cypress tests errors:\n${stderr}`)
  //       }
  //       resolve(null)
  //     }
  //   )
  // })
}

async function runTests() {
  const data = await setup()
  const oneCXBaseEnv = await new OneCXBaseEnvironment({}).start()

  console.log('starting e2e tests')
  try {
    // const cypressContainer = await setupCypressContainer(data.network, data.uiContainer!, data.keycloakContainer!)
    // console.log(
    //   (
    //     await cypressContainer.exec([
    //       'cypress',
    //       'run',
    //       '--env',
    //       `SHELL_ADDRESS=${data.uiContainer}:8080,KEYCLOAK_ADDRESS=${data.keycloakContainer}:8080`
    //     ])
    //   ).stdout
    // )
    // const screenshootsStream = await cypressContainer.copyArchiveFromContainer('/e2e/e2e-tests/cypress/screenshots')
    // const filePath = path.join(path.resolve('./'), 'e2e-tests/cypress/screenshots.tar')
    // const writeableStream = fs.createWriteStream(filePath)
    // screenshootsStream.pipe(writeableStream)
    // writeableStream.on('finish', () => {
    //   console.log('Screenshots has been written successfully.')
    // })
    // writeableStream.on('error', (err) => {
    //   console.error('Error writing file:', err)
    // })
    // await new Promise((r) => setTimeout(r, 5_000))
    // console.log('finishing e2e tests')
  } catch (error) {
    console.error('Cypress tests failed', error)
  } finally {
    // await new Promise((r) => setTimeout(r, 100_000))
    await oneCXBaseEnv.teardown()
  }
}

runTests().catch((err) => console.error(err))

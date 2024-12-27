import { GenericContainer, Network, StartedNetwork, StartedTestContainer } from 'testcontainers'
import * as path from 'path'
import * as fs from 'fs'
import { checkDbExistence, importDatabaseData, logStart, logStarted, logStopped } from './e2e-lib/utils'
import { OneCXPostgresContainer } from './e2e-lib/onecx-postgres'
import { containerImagesEnv } from './e2e-lib/e2e-config'
import { OneCXKeycloakContainer } from './e2e-lib/onecx-keycloak'
import { OneCXThemeSvcContainer } from './e2e-lib/onecx-theme-svc'
import { OneCXPermissionSvcContainer } from './e2e-lib/onecx-permission-svc'
import { OneCXWorkspaceSvcContainer } from './e2e-lib/onecx-workspace-svc'
import { OneCXUserProfileSvcContainer } from './e2e-lib/onecx-user-profile-svc'
import { OneCXTenantSvcContainer } from './e2e-lib/onecx-tenant-svc'
import { OneCXProductStoreSvcContainer } from './e2e-lib/onecx-product-store-svc'
import { OneCXIamKcSvcContainer } from './e2e-lib/onecx-iam-kc-svc'
import { OneCXShellBffContainer } from './e2e-lib/onecx-shell-bff'
import { OneCXWorkspaceBffContainer } from './e2e-lib/onecx-workspace-bff'
import { OneCXShellUiContainer } from './e2e-lib/onecx-shell-ui'
import { OneCXWorkspaceUiContainer } from './e2e-lib/onecx-workspace-ui'
import { OneCXPermissionBffContainer } from './e2e-lib/onecx-permission-bff'
import { OneCXIamBffContainer } from './e2e-lib/onecx-iam-bff'
import { OneCXProductStoreBffContainer } from './e2e-lib/onecx-product-store-bff'
import { OneCXTenantBffContainer } from './e2e-lib/onecx-tenant-bff'
import { OneCXThemeBffContainer } from './e2e-lib/onecx-theme-bff'
import { OneCXUserProfileBffContainer } from './e2e-lib/onecx-user-profile-bff'
import { OneCXThemeUiContainer } from './e2e-lib/onecx-theme-ui'
import { OneCXIamUiContainer } from './e2e-lib/onecx-iam-ui'
import { OneCXPermissionUiContainer } from './e2e-lib/onecx-permision-ui'
import { OneCXProductStoreUiContainer } from './e2e-lib/onecx-product-store-ui'
import { OneCXTenantUiContainer } from './e2e-lib/onecx-tenant-ui'
import { OneCXUserProfileUiContainer } from './e2e-lib/onecx-user-profile-ui'

// TODO: Make variables for container names
// TODO: Whenever something is not correctly set up, script should teardown and fail
// TODO: Most of the containers should be taken into separate lib
// TODO: Create lib with custom classes to extend test containers
// TODO: Use .env for container images

function log(message: string) {
  console.log(`SETUP: ${message}`)
}

async function setup() {
  console.log('starting e2e tests setup')

  logStart('network')
  const network = await new Network().start()
  logStarted('network')

  const postgresDbContainer = await new OneCXPostgresContainer(
    containerImagesEnv.POSTGRES,
    network,
    path.resolve('e2e-tests/init-data/db')
  ).start()

  const databases = await postgresDbContainer.getOneCXDatabases()
  log(`Created databases ${databases}`)

  const coreDatabases = [
    'postgres',
    'keycloak',
    'keycloak_public',
    'onecx_theme',
    'onecx_workspace',
    'onecx_permission',
    'onecx_product_store',
    'onecx_user_profile',
    'onecx_tenant'
  ]

  // TODO: Stop if not all dbs exist
  const allDatabasesExist = await checkDbExistence(coreDatabases, postgresDbContainer, log)
  allDatabasesExist ? log('All databases exist.') : log('Not all databases exist.')

  // depends on postgresDbContainer
  const keycloakContainer = await new OneCXKeycloakContainer(
    containerImagesEnv.KEYCLOAK,
    network,
    path.resolve('e2e-tests/init-data/keycloak/imports')
  ).start()

  // depends on postgresDbContainer
  const themeSvcContainer = await new OneCXThemeSvcContainer(containerImagesEnv.ONECX_THEME_SVC, network).start()

  // depends on postgresDbContainer
  const permissionSvcContainer = await new OneCXPermissionSvcContainer(
    containerImagesEnv.ONECX_PERMISSION_SVC,
    network
  ).start()

  // depends on postgresDbContainer
  const productStoreSvcContainer = await new OneCXProductStoreSvcContainer(
    containerImagesEnv.ONECX_PRODUCT_STORE_SVC,
    network
  ).start()

  // depends on postgresDbContainer
  const userProfileSvcContainer = await new OneCXUserProfileSvcContainer(
    containerImagesEnv.ONECX_USER_PROFILE_SVC,
    network
  ).start()

  // depends on postgresDbContainer
  const iamKcSvcContainer = await new OneCXIamKcSvcContainer(containerImagesEnv.ONECX_IAM_KC_SVC, network).start()

  // depends on postgresDbContainer
  const tenantSvcContainer = await new OneCXTenantSvcContainer(containerImagesEnv.ONECX_TENANT_SVC, network).start()

  // depends on postgresDbContainer
  const workspaceSvcContainer = await new OneCXWorkspaceSvcContainer(
    containerImagesEnv.ONECX_WORKSPACE_SVC,
    network
  ).start()

  // depends on postgresDbContainer, themeSvcContainer, permission_svc, product_store_svc, user_profile_svc, iam_kc_svc, tenant_svc, workspace_svc
  await importDatabaseData(
    {
      THEME_SVC_PORT: themeSvcContainer.getMappedPort(8080),
      PERMISSION_SVC_PORT: permissionSvcContainer.getMappedPort(8080),
      PRODUCT_STORE_SVC_PORT: productStoreSvcContainer.getMappedPort(8080),
      USER_PROFILE_SVC_PORT: userProfileSvcContainer.getMappedPort(8080),
      IAM_KC_SVC_PORT: iamKcSvcContainer.getMappedPort(8080),
      TENANT_SVC_PORT: tenantSvcContainer.getMappedPort(8080),
      WORKSPACE_SVC_PORT: workspaceSvcContainer.getMappedPort(8080)
    },
    path.resolve('e2e-tests/import-onecx.sh')
  )

  // depends on postgresDbContainer, themeSvcContainer, permission_svc, product_store_svc, user_profile_svc, iam_kc_svc, tenant_svc, workspace_svc
  const shellBffContainer = await new OneCXShellBffContainer(containerImagesEnv.ONECX_SHELL_BFF, network).start()

  // depends on keycloak, shell-bff
  const shellUiContainer = await new OneCXShellUiContainer(containerImagesEnv.ONECX_SHELL_UI, network).start()

  // depends on themeSvc
  const themeBffContainer = await new OneCXThemeBffContainer(containerImagesEnv.ONECX_THEME_BFF, network).start()

  // depends on workspaceSvc
  const workspaceBffContainer = await new OneCXWorkspaceBffContainer(
    containerImagesEnv.ONECX_WORKSPACE_BFF,
    network
  ).start()

  // depends on permissionSvc
  const permissionBffContainer = await new OneCXPermissionBffContainer(
    containerImagesEnv.ONECX_PERMISSION_BFF,
    network
  ).start()

  // depends on productStoreSvc
  const productStoreBffContainer = await new OneCXProductStoreBffContainer(
    containerImagesEnv.ONECX_PRODUCT_STORE_BFF,
    network
  ).start()

  // depends on userProfileSvc
  const userProfileBffContainer = await new OneCXUserProfileBffContainer(
    containerImagesEnv.ONECX_USER_PROFILE_BFF,
    network
  ).start()

  // depends on iamSvc
  const iamBffContainer = await new OneCXIamBffContainer(containerImagesEnv.ONECX_IAM_BFF, network).start()

  // depends on tenantSvc
  const tenantBffContainer = await new OneCXTenantBffContainer(containerImagesEnv.ONECX_TENANT_BFF, network).start()

  // depends on themeBff
  const themeUiContainer = await new OneCXThemeUiContainer(containerImagesEnv.ONECX_THEME_UI, network).start()

  // depends on workspaceBff
  const workspaceUiContainer = await new OneCXWorkspaceUiContainer(
    containerImagesEnv.ONECX_WORKSPACE_UI,
    network
  ).start()

  // depends on permissionUi
  const permissionUiContainer = await new OneCXPermissionUiContainer(
    containerImagesEnv.ONECX_PERMISSION_UI,
    network
  ).start()

  // depends on productStoreUi
  const productStoreUiContainer = await new OneCXProductStoreUiContainer(
    containerImagesEnv.ONECX_PRODUCT_STORE_UI,
    network
  ).start()

  // depends on userProfileUi
  const userProfileUiContainer = await new OneCXUserProfileUiContainer(
    containerImagesEnv.ONECX_USER_PROFILE_UI,
    network
  ).start()

  // depends on iamUi
  const iamUiContainer = await new OneCXIamUiContainer(containerImagesEnv.ONECX_IAM_UI, network).start()

  // depends on tenantUi
  const tenantUiContainer = await new OneCXTenantUiContainer(containerImagesEnv.ONECX_TENANT_UI, network).start()

  console.log('finishing e2e tests setup')
  return {
    services: [
      postgresDbContainer,
      keycloakContainer,
      ...[
        themeSvcContainer,
        permissionSvcContainer,
        productStoreSvcContainer,
        userProfileSvcContainer,
        iamKcSvcContainer,
        tenantSvcContainer,
        workspaceSvcContainer
      ],
      ...[
        shellBffContainer,
        themeBffContainer,
        workspaceBffContainer,
        permissionBffContainer,
        productStoreBffContainer,
        userProfileBffContainer,
        iamBffContainer,
        tenantBffContainer
      ],
      ...[
        shellUiContainer,
        themeUiContainer,
        workspaceUiContainer,
        permissionUiContainer,
        productStoreUiContainer,
        userProfileUiContainer,
        iamUiContainer,
        tenantUiContainer
      ],
      network
    ],
    uiContainer: shellUiContainer.getOneCXAlias(),
    keycloakContainer: keycloakContainer.getOneCXAlias(),
    network: network
  }
}

async function teardown(services: Array<StartedNetwork | StartedTestContainer>) {
  console.log('starting e2e tests teardown')
  for (const s of services) {
    await s.stop()
    logStopped(s)
  }
  console.log('finishing e2e tests teardown')
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

  console.log('starting e2e tests')
  try {
    const cypressContainer = await setupCypressContainer(data.network, data.uiContainer!, data.keycloakContainer!)
    console.log(
      (
        await cypressContainer.exec([
          'cypress',
          'run',
          '--env',
          `SHELL_ADDRESS=${data.uiContainer}:8080,KEYCLOAK_ADDRESS=${data.keycloakContainer}:8080`
        ])
      ).stdout
    )
    const screenshootsStream = await cypressContainer.copyArchiveFromContainer('/e2e/e2e-tests/cypress/screenshots')
    const filePath = path.join(path.resolve('./'), 'e2e-tests/cypress/screenshots.tar')
    const writeableStream = fs.createWriteStream(filePath)
    screenshootsStream.pipe(writeableStream)

    writeableStream.on('finish', () => {
      console.log('Screenshots has been written successfully.')
    })
    writeableStream.on('error', (err) => {
      console.error('Error writing file:', err)
    })
    await new Promise((r) => setTimeout(r, 5_000))
    console.log('finishing e2e tests')
  } catch (error) {
    console.error('Cypress tests failed', error)
  } finally {
    // await new Promise((r) => setTimeout(r, 100_000))
    await teardown(data.services)
  }
}

runTests().catch((err) => console.error(err))

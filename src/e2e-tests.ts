import { exec } from 'child_process'
import { GenericContainer, Network, StartedNetwork, StartedTestContainer, Wait } from 'testcontainers'
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

// async function setupThemeBff(containerName: string, network: StartedNetwork): Promise<StartedTestContainer> {
//   logStart('container', containerName)
//   const container = await new GenericContainer(process.env.ONECX_THEME_BFF!)
//     .withName(containerName)
//     .withEnvironment({
//       ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-theme',
//       ...commonEnv,
//       ...bffEnv
//     })
//     .withHealthCheck({
//       test: ['CMD-SHELL', `curl --head -fsS http://localhost:8080/q/health`],
//       interval: 10_000,
//       timeout: 5_000,
//       retries: 3
//     })
//     .withNetwork(network)
//     .withNetworkAliases(containerName)
//     .withExposedPorts(8080)
//     .withWaitStrategy(Wait.forHealthCheck())
//     .withLogConsumer((stream) => {
//       stream.on('data', (line) => console.log(`${containerName}: `, line))
//       stream.on('err', (line) => console.error(`${containerName}: `, line))
//       stream.on('end', () => console.log(`${containerName}: Stream closed`))
//     })
//     .start()
//   logStarted(container, 8080)
//   return container
// }

// async function setupPermissionBff(containerName: string, network: StartedNetwork): Promise<StartedTestContainer> {
//   logStart('container', containerName)
//   const container = await new GenericContainer(process.env.ONECX_PERMISSION_BFF!)
//     .withName(containerName)
//     .withEnvironment({
//       ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-permission',
//       ...commonEnv,
//       ...bffEnv
//     })
//     .withHealthCheck({
//       test: ['CMD-SHELL', `curl --head -fsS http://localhost:8080/q/health`],
//       interval: 10_000,
//       timeout: 5_000,
//       retries: 3
//     })
//     .withNetwork(network)
//     .withNetworkAliases(containerName)
//     .withExposedPorts(8080)
//     .withWaitStrategy(Wait.forHealthCheck())
//     .withLogConsumer((stream) => {
//       stream.on('data', (line) => console.log(`${containerName}: `, line))
//       stream.on('err', (line) => console.error(`${containerName}: `, line))
//       stream.on('end', () => console.log(`${containerName}: Stream closed`))
//     })
//     .start()
//   logStarted(container, 8080)
//   return container
// }

// async function setupProductStoreBff(containerName: string, network: StartedNetwork): Promise<StartedTestContainer> {
//   logStart('container', containerName)
//   const container = await new GenericContainer(process.env.ONECX_PRODUCT_STORE_BFF!)
//     .withName(containerName)
//     .withEnvironment({
//       ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-product-store',
//       ...commonEnv,
//       ...bffEnv
//     })
//     .withHealthCheck({
//       test: ['CMD-SHELL', `curl --head -fsS http://localhost:8080/q/health`],
//       interval: 10_000,
//       timeout: 5_000,
//       retries: 3
//     })
//     .withNetwork(network)
//     .withNetworkAliases(containerName)
//     .withExposedPorts(8080)
//     .withWaitStrategy(Wait.forHealthCheck())
//     .withLogConsumer((stream) => {
//       stream.on('data', (line) => console.log(`${containerName}: `, line))
//       stream.on('err', (line) => console.error(`${containerName}: `, line))
//       stream.on('end', () => console.log(`${containerName}: Stream closed`))
//     })
//     .start()
//   logStarted(container, 8080)
//   return container
// }

// async function setupUserProfileBff(containerName: string, network: StartedNetwork): Promise<StartedTestContainer> {
//   logStart('container', containerName)
//   const container = await new GenericContainer(process.env.ONECX_USER_PROFILE_BFF!)
//     .withName(containerName)
//     .withEnvironment({
//       ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-user-profile',
//       ...commonEnv,
//       ...bffEnv
//     })
//     .withHealthCheck({
//       test: ['CMD-SHELL', `curl --head -fsS http://localhost:8080/q/health`],
//       interval: 10_000,
//       timeout: 5_000,
//       retries: 3
//     })
//     .withNetwork(network)
//     .withNetworkAliases(containerName)
//     .withExposedPorts(8080)
//     .withWaitStrategy(Wait.forHealthCheck())
//     .withLogConsumer((stream) => {
//       stream.on('data', (line) => console.log(`${containerName}: `, line))
//       stream.on('err', (line) => console.error(`${containerName}: `, line))
//       stream.on('end', () => console.log(`${containerName}: Stream closed`))
//     })
//     .start()
//   logStarted(container, 8080)
//   return container
// }

// async function setupIamBff(containerName: string, network: StartedNetwork): Promise<StartedTestContainer> {
//   logStart('container', containerName)
//   const container = await new GenericContainer(process.env.ONECX_IAM_BFF!)
//     .withName(containerName)
//     .withEnvironment({
//       ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-iam',
//       ...commonEnv,
//       ...bffEnv
//     })
//     .withHealthCheck({
//       test: ['CMD-SHELL', `curl --head -fsS http://localhost:8080/q/health`],
//       interval: 10_000,
//       timeout: 5_000,
//       retries: 3
//     })
//     .withNetwork(network)
//     .withNetworkAliases(containerName)
//     .withExposedPorts(8080)
//     .withWaitStrategy(Wait.forHealthCheck())
//     .withLogConsumer((stream) => {
//       stream.on('data', (line) => console.log(`${containerName}: `, line))
//       stream.on('err', (line) => console.error(`${containerName}: `, line))
//       stream.on('end', () => console.log(`${containerName}: Stream closed`))
//     })
//     .start()
//   logStarted(container, 8080)
//   return container
// }

// async function setupTenantBff(containerName: string, network: StartedNetwork): Promise<StartedTestContainer> {
//   logStart('container', containerName)
//   const container = await new GenericContainer(process.env.ONECX_TENANT_BFF!)
//     .withName(containerName)
//     .withEnvironment({
//       ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-tenant',
//       ...commonEnv,
//       ...bffEnv
//     })
//     .withHealthCheck({
//       test: ['CMD-SHELL', `curl --head -fsS http://localhost:8080/q/health`],
//       interval: 10_000,
//       timeout: 5_000,
//       retries: 3
//     })
//     .withNetwork(network)
//     .withNetworkAliases(containerName)
//     .withExposedPorts(8080)
//     .withWaitStrategy(Wait.forHealthCheck())
//     .withLogConsumer((stream) => {
//       stream.on('data', (line) => console.log(`${containerName}: `, line))
//       stream.on('err', (line) => console.error(`${containerName}: `, line))
//       stream.on('end', () => console.log(`${containerName}: Stream closed`))
//     })
//     .start()
//   logStarted(container, 8080)
//   return container
// }

// async function setupThemeUi(containerName: string, network: StartedNetwork): Promise<StartedTestContainer> {
//   logStart('container', containerName)
//   const container = await new GenericContainer(process.env.ONECX_THEME_UI!)
//     .withName(containerName)
//     .withEnvironment({
//       APP_BASE_HREF: '/mfe/theme/',
//       APP_ID: 'onecx-theme-ui',
//       PRODUCT_NAME: 'onecx-theme'
//     })
//     .withNetwork(network)
//     .withNetworkAliases(containerName)
//     .withExposedPorts(8080)
//     .withLogConsumer((stream) => {
//       stream.on('data', (line) => console.log(`${containerName}: `, line))
//       stream.on('err', (line) => console.error(`${containerName}: `, line))
//       stream.on('end', () => console.log(`${containerName}: Stream closed`))
//     })
//     .start()
//   logStarted(container, 8080)
//   return container
// }

// async function setupPermissionUi(containerName: string, network: StartedNetwork): Promise<StartedTestContainer> {
//   logStart('container', containerName)
//   const container = await new GenericContainer(process.env.ONECX_PERMISSION_UI!)
//     .withName(containerName)
//     .withEnvironment({
//       APP_BASE_HREF: '/mfe/permission/',
//       APP_ID: 'onecx-permission-ui',
//       PRODUCT_NAME: 'onecx-permission'
//     })
//     .withNetwork(network)
//     .withNetworkAliases(containerName)
//     .withExposedPorts(8080)
//     .withLogConsumer((stream) => {
//       stream.on('data', (line) => console.log(`${containerName}: `, line))
//       stream.on('err', (line) => console.error(`${containerName}: `, line))
//       stream.on('end', () => console.log(`${containerName}: Stream closed`))
//     })
//     .start()
//   logStarted(container, 8080)
//   return container
// }

// async function setupProductStoreUi(containerName: string, network: StartedNetwork): Promise<StartedTestContainer> {
//   logStart('container', containerName)
//   const container = await new GenericContainer(process.env.ONECX_PRODUCT_STORE_UI!)
//     .withName(containerName)
//     .withEnvironment({
//       APP_BASE_HREF: '/mfe/product-store/',
//       APP_ID: 'onecx-product-store-ui',
//       PRODUCT_NAME: 'onecx-product-store'
//     })
//     .withNetwork(network)
//     .withNetworkAliases(containerName)
//     .withExposedPorts(8080)
//     .withLogConsumer((stream) => {
//       stream.on('data', (line) => console.log(`${containerName}: `, line))
//       stream.on('err', (line) => console.error(`${containerName}: `, line))
//       stream.on('end', () => console.log(`${containerName}: Stream closed`))
//     })
//     .start()
//   logStarted(container, 8080)
//   return container
// }

// async function setupUserProfileUi(containerName: string, network: StartedNetwork): Promise<StartedTestContainer> {
//   logStart('container', containerName)
//   const container = await new GenericContainer(process.env.ONECX_USER_PROFILE_UI!)
//     .withName(containerName)
//     .withEnvironment({
//       APP_BASE_HREF: '/mfe/user-profile/',
//       APP_ID: 'onecx-user-profile-ui',
//       PRODUCT_NAME: 'onecx-user-profile'
//     })
//     .withNetwork(network)
//     .withNetworkAliases(containerName)
//     .withExposedPorts(8080)
//     .withLogConsumer((stream) => {
//       stream.on('data', (line) => console.log(`${containerName}: `, line))
//       stream.on('err', (line) => console.error(`${containerName}: `, line))
//       stream.on('end', () => console.log(`${containerName}: Stream closed`))
//     })
//     .start()
//   logStarted(container, 8080)
//   return container
// }

// async function setupIamUi(containerName: string, network: StartedNetwork): Promise<StartedTestContainer> {
//   logStart('container', containerName)
//   const container = await new GenericContainer(process.env.ONECX_IAM_UI!)
//     .withName(containerName)
//     .withEnvironment({
//       APP_BASE_HREF: '/mfe/iam/',
//       APP_ID: 'onecx-iam-ui',
//       PRODUCT_NAME: 'onecx-iam'
//     })
//     .withNetwork(network)
//     .withNetworkAliases(containerName)
//     .withExposedPorts(8080)
//     .withLogConsumer((stream) => {
//       stream.on('data', (line) => console.log(`${containerName}: `, line))
//       stream.on('err', (line) => console.error(`${containerName}: `, line))
//       stream.on('end', () => console.log(`${containerName}: Stream closed`))
//     })
//     .start()
//   logStarted(container, 8080)
//   return container
// }

// async function setupTenantUi(containerName: string, network: StartedNetwork): Promise<StartedTestContainer> {
//   logStart('container', containerName)
//   const container = await new GenericContainer(process.env.ONECX_TENANT_UI!)
//     .withName(containerName)
//     .withEnvironment({
//       APP_BASE_HREF: '/mfe/tenant/',
//       APP_ID: 'onecx-tenant-ui',
//       PRODUCT_NAME: 'onecx-tenant'
//     })
//     .withNetwork(network)
//     .withNetworkAliases(containerName)
//     .withExposedPorts(8080)
//     .withLogConsumer((stream) => {
//       stream.on('data', (line) => console.log(`${containerName}: `, line))
//       stream.on('err', (line) => console.error(`${containerName}: `, line))
//       stream.on('end', () => console.log(`${containerName}: Stream closed`))
//     })
//     .start()
//   logStarted(container, 8080)
//   return container
// }

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

  // // depends on themeSvc
  // const themeBffName = 'onecx-theme-bff'
  // const themeBffContainer = await setupThemeBff(themeBffName, network)

  // depends on workspaceSvc
  const workspaceBffContainer = await new OneCXWorkspaceBffContainer(
    containerImagesEnv.ONECX_WORKSPACE_BFF,
    network
  ).start()

  // // depends on permissionSvc
  // const permissionBffName = 'onecx-permission-bff'
  // const permissionBffContainer = await setupPermissionBff(permissionBffName, network)

  // // depends on productStoreSvc
  // const productStoreBffName = 'onecx-productStore-bff'
  // const productStoreBffContainer = await setupProductStoreBff(productStoreBffName, network)

  // // depends on userProfileSvc
  // const userProfileBffName = 'onecx-userProfile-bff'
  // const userProfileBffContainer = await setupUserProfileBff(userProfileBffName, network)

  // // depends on iamSvc
  // const iamBffName = 'onecx-iam-bff'
  // const iamBffContainer = await setupIamBff(iamBffName, network)

  // // depends on tenantSvc
  // const tenantBffName = 'onecx-tenant-bff'
  // const tenantBffContainer = await setupTenantBff(tenantBffName, network)

  // // depends on themeBff
  // const themeUiName = 'onecx-theme-ui'
  // const themeUiContainer = await setupThemeUi(themeUiName, network)

  // depends on workspaceBff
  const workspaceUiContainer = await new OneCXWorkspaceUiContainer(
    containerImagesEnv.ONECX_WORKSPACE_UI,
    network
  ).start()

  // // depends on permissionUi
  // const permissionUiName = 'onecx-permission-ui'
  // const permissionUiContainer = await setupPermissionUi(permissionUiName, network)

  // // depends on productStoreUi
  // const productStoreUiName = 'onecx-productStore-ui'
  // const productStoreUiContainer = await setupProductStoreUi(productStoreUiName, network)

  // // depends on userProfileUi
  // const userProfileUiName = 'onecx-userProfile-ui'
  // const userProfileUiContainer = await setupUserProfileUi(userProfileUiName, network)

  // // depends on iamUi
  // const iamUiName = 'onecx-iam-ui'
  // const iamUiContainer = await setupIamUi(iamUiName, network)

  // // depends on tenantUi
  // const tenantUiName = 'onecx-tenant-ui'
  // const tenantUiContainer = await setupTenantUi(tenantUiName, network)

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
        // themeBffContainer,
        workspaceBffContainer
        // permissionBffContainer,
        // productStoreBffContainer,
        // userProfileBffContainer,
        // iamBffContainer,
        // tenantBffContainer
      ],
      ...[
        shellUiContainer,
        // themeUiContainer,
        workspaceUiContainer
        // permissionUiContainer,
        // productStoreUiContainer,
        // userProfileUiContainer,
        // iamUiContainer,
        // tenantUiContainer
      ],
      network
    ],
    uiContainer: shellUiContainer.getOneCXAlias(),
    uiPort: shellUiContainer.getMappedPort(8080), // TODO: Remove?
    keycloakContainer: keycloakContainer.getOneCXAlias(),
    keycloakPort: keycloakContainer.getMappedPort(8080), // TODO: Remove?
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

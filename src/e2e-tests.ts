import { exec } from 'child_process'
import { GenericContainer, Network, StartedNetwork, StartedTestContainer, Wait } from 'testcontainers'
import * as path from 'path'

type ResourceType = 'container' | 'network'
type StartedResource = StartedNetwork | StartedTestContainer

const commonEnv: { [key: string]: string } = {
  KC_REALM: process.env.KC_REALM!,
  QUARKUS_OIDC_AUTH_SERVER_URL: process.env.QUARKUS_OIDC_AUTH_SERVER_URL!,
  QUARKUS_OIDC_TOKEN_ISSUER: process.env.QUARKUS_OIDC_TOKEN_ISSUER!,
  TKIT_SECURITY_AUTH_ENABLED: process.env.TKIT_SECURITY_AUTH_ENABLED!,
  'TKIT_RS_CONTEXT_TENANT-ID_MOCK_ENABLED': process.env['TKIT_RS_CONTEXT_TENANT-ID_MOCK_ENABLED']!,
  TKIT_LOG_JSON_ENABLED: process.env.TKIT_LOG_JSON_ENABLED!
}

const bffEnv: { [key: string]: string } = {}

const svcEnv: { [key: string]: string } = {
  TKIT_DATAIMPORT_ENABLED: 'true',
  ONECX_TENANT_CACHE_ENABLED: 'false'
}

async function logStart(type: ResourceType, name?: string) {
  if (type === 'container') {
    console.log(`Starting ${name} container`)
  } else if (type === 'network') {
    console.log(`Starting network`)
  }
}
async function logStarted(resource: StartedResource, port?: number) {
  if ('getMappedPort' in resource && port) {
    console.log(`Started ${resource.getName()} container on port ${resource.getMappedPort(port)}`)
  } else if ('getMappedPort' in resource && !port) {
    console.log(`Started ${resource.getName()} container`)
  } else {
    console.log(`Started ${resource.getName()} network`)
  }
}
async function logStopped(resource: StartedResource) {
  console.log(`Stopped ${resource.getName()}`)
}

// postgresdb:
//   depends_on:
//     traefik:
//       condition: service_started
//   labels:
//     - "traefik.http.services.postgresdb.loadbalancer.server.port=5432"
//     - "traefik.http.routers.postgresdb.rule=Host(`postgresdb`)"
async function setupPostgres(containerName: string, network: StartedNetwork): Promise<StartedTestContainer> {
  logStart('container', containerName)
  const startedContainer = await new GenericContainer(process.env.POSTGRES!)
    .withName(containerName)
    .withCommand(['-cmax_prepared_transactions=100'])
    .withEnvironment({
      POSTGRES_USER: 'postgres',
      POSTGRES_PASSWORD: 'admin',
      POSTGRES_DB: 'postgres'
    })
    .withHealthCheck({
      test: ['CMD-SHELL', 'pg_isready -U postgres'],
      interval: 10_000,
      timeout: 5_000,
      retries: 3
    })
    .withNetwork(network)
    .withExposedPorts(5432)
    .withCopyDirectoriesToContainer([
      {
        source: path.resolve('e2e-tests/init-data/db'),
        target: '/docker-entrypoint-initdb.d/'
      }
    ])
    .withWaitStrategy(Wait.forHealthCheck())
    .withLogConsumer((stream) => {
      stream.on('data', (line) => console.log(`${containerName}: `, line))
      stream.on('err', (line) => console.error(`${containerName}: `, line))
      stream.on('end', () => console.log(`${containerName}: Stream closed`))
    })
    .start()
  logStarted(startedContainer, 5432)
  return startedContainer
}

// keycloak-app:
//   depends_on:
//     postgresdb:
//       condition: service_healthy
//   labels:
//     - "traefik.http.services.keycloak-intranet.loadbalancer.server.port=8080"
//     - "traefik.http.routers.keycloak-intranet.rule=Host(`keycloak-app`)"
async function setupKeycloak(containerName: string, network: StartedNetwork): Promise<StartedTestContainer> {
  logStart('container', containerName)
  const startedContainer = await new GenericContainer(process.env.KEYCLOAK!)
    .withName(containerName)
    .withCommand(['start-dev', '--import-realm'])
    .withEnvironment({
      KEYCLOAK_ADMIN: 'admin',
      KEYCLOAK_ADMIN_PASSWORD: 'admin',
      KC_DB: 'postgres',
      KC_DB_POOL_INITIAL_SIZE: '1',
      KC_DB_POOL_MAX_SIZE: '5',
      KC_DB_POOL_MIN_SIZE: '2',
      KC_DB_URL_DATABASE: 'keycloak',
      KC_DB_URL_HOST: 'postgresdb',
      KC_DB_USERNAME: 'keycloak',
      KC_DB_PASSWORD: 'keycloak',
      // KC_HOSTNAME: 'keycloak-app',
      KC_HOSTNAME_STRICT: 'false',
      KC_HTTP_ENABLED: 'true',
      KC_HTTP_PORT: '8080',
      KC_HEALTH_ENABLED: 'true'
    })
    .withHealthCheck({
      test: [
        'CMD-SHELL',
        `{ printf >&3 'GET /realms/onecx/.well-known/openid-configuration HTTP/1.0\\r\\nHost: localhost\\r\\n\\r\\n'; cat <&3; } 3<>/dev/tcp/localhost/8080 | head -1 | grep 200`
      ],
      interval: 10_000,
      timeout: 5_000,
      retries: 10
    })
    .withNetwork(network)
    .withExposedPorts(8080)
    .withCopyDirectoriesToContainer([
      {
        source: path.resolve('e2e-tests/init-data/keycloak/imports'),
        target: '/opt/keycloak/data/import'
      }
    ])
    .withStartupTimeout(100_000)
    .withWaitStrategy(Wait.forHealthCheck())
    .withLogConsumer((stream) => {
      stream.on('data', (line) => console.log(`${containerName}: `, line))
      stream.on('err', (line) => console.error(`${containerName}: `, line))
      stream.on('end', () => console.log(`${containerName}: Stream closed`))
    })
    .start()
  logStarted(startedContainer, 8080)
  return startedContainer
}

// onecx-theme-svc:
//   labels:
//     - "traefik.http.services.onecx-theme-svc.loadbalancer.server.port=8080"
//     - "traefik.http.routers.onecx-theme-svc.rule=Host(`onecx-theme-svc`)"
async function setupThemeSvc(
  containerName: string,
  network: StartedNetwork,
  postgresContainerName: string
): Promise<StartedTestContainer> {
  logStart('container', containerName)
  const container = await new GenericContainer(process.env.ONECX_THEME_SVC!)
    .withName(containerName)
    .withEnvironment({
      QUARKUS_DATASOURCE_USERNAME: 'onecx_theme',
      QUARKUS_DATASOURCE_PASSWORD: 'onecx_theme',
      QUARKUS_DATASOURCE_JDBC_URL: `jdbc:postgresql://${postgresContainerName}:5432/onecx_theme?sslmode=disable`,
      ...commonEnv,
      ...svcEnv
    })
    .withHealthCheck({
      test: ['CMD-SHELL', `curl --head -fsS http://localhost:8080/q/health`],
      interval: 10_000,
      timeout: 5_000,
      retries: 3
    })
    .withNetwork(network)
    .withExposedPorts(8080)
    .withWaitStrategy(Wait.forHealthCheck())
    .withLogConsumer((stream) => {
      stream.on('data', (line) => console.log(`${containerName}: `, line))
      stream.on('err', (line) => console.error(`${containerName}: `, line))
      stream.on('end', () => console.log(`${containerName}: Stream closed`))
    })
    .start()
  logStarted(container, 8080)
  return container
}

// onecx-permission-svc:
//   labels:
//     - "traefik.http.services.onecx-permission-svc.loadbalancer.server.port=8080"
//     - "traefik.http.routers.onecx-permission-svc.rule=Host(`onecx-permission-svc`)"
async function setupPermissionSvc(
  containerName: string,
  network: StartedNetwork,
  postgresContainerName: string
): Promise<StartedTestContainer> {
  logStart('container', containerName)
  const container = await new GenericContainer(process.env.ONECX_PERMISSION_SVC!)
    .withName(containerName)
    .withEnvironment({
      QUARKUS_DATASOURCE_USERNAME: 'onecx_permission',
      QUARKUS_DATASOURCE_PASSWORD: 'onecx_permission',
      QUARKUS_DATASOURCE_JDBC_URL: `jdbc:postgresql://${postgresContainerName}:5432/onecx_permission?sslmode=disable`,
      QUARKUS_REST_CLIENT_ONECX_TENANT_URL: 'http://onecx-tenant-svc:8080',
      ONECX_PERMISSION_TOKEN_VERIFIED: 'false',
      TKIT_RS_CONTEXT_TENANT_ID_ENABLED: 'false',
      ...commonEnv,
      ...svcEnv
    })
    .withHealthCheck({
      test: ['CMD-SHELL', `curl --head -fsS http://localhost:8080/q/health`],
      interval: 10_000,
      timeout: 5_000,
      retries: 3
    })
    .withNetwork(network)
    .withExposedPorts(8080)
    .withWaitStrategy(Wait.forHealthCheck())
    .withLogConsumer((stream) => {
      stream.on('data', (line) => console.log(`${containerName}: `, line))
      stream.on('err', (line) => console.error(`${containerName}: `, line))
      stream.on('end', () => console.log(`${containerName}: Stream closed`))
    })
    .start()
  logStarted(container, 8080)
  return container
}

// onecx-product-store-svc:
//     labels:
//       - "traefik.http.services.onecx-product-store-svc.loadbalancer.server.port=8080"
//       - "traefik.http.routers.onecx-product-store-svc.rule=Host(`onecx-product-store-svc`)"
async function setupProductStoreSvc(
  containerName: string,
  network: StartedNetwork,
  postgresContainerName: string
): Promise<StartedTestContainer> {
  logStart('container', containerName)
  const container = await new GenericContainer(process.env.ONECX_PRODUCT_STORE_SVC!)
    .withName(containerName)
    .withEnvironment({
      QUARKUS_DATASOURCE_USERNAME: 'onecx_product_store',
      QUARKUS_DATASOURCE_PASSWORD: 'onecx_product_store',
      QUARKUS_DATASOURCE_JDBC_URL: `jdbc:postgresql://${postgresContainerName}:5432/onecx_product_store?sslmode=disable`,
      ...commonEnv,
      ...svcEnv
    })
    .withHealthCheck({
      test: ['CMD-SHELL', `curl --head -fsS http://localhost:8080/q/health`],
      interval: 10_000,
      timeout: 5_000,
      retries: 3
    })
    .withNetwork(network)
    .withExposedPorts(8080)
    .withWaitStrategy(Wait.forHealthCheck())
    .withLogConsumer((stream) => {
      stream.on('data', (line) => console.log(`${containerName}: `, line))
      stream.on('err', (line) => console.error(`${containerName}: `, line))
      stream.on('end', () => console.log(`${containerName}: Stream closed`))
    })
    .start()
  logStarted(container, 8080)
  return container
}

// onecx-user-profile-svc:
//     labels:
//       - "traefik.http.services.onecx-user-profile-svc.loadbalancer.server.port=8080"
//       - "traefik.http.routers.onecx-user-profile-svc.rule=Host(`onecx-user-profile-store-svc`)"
async function setupUserProfileSvc(
  containerName: string,
  network: StartedNetwork,
  postgresContainerName: string
): Promise<StartedTestContainer> {
  logStart('container', containerName)
  const container = await new GenericContainer(process.env.ONECX_USER_PROFILE_SVC!)
    .withName(containerName)
    .withEnvironment({
      QUARKUS_DATASOURCE_USERNAME: 'onecx_user_profile',
      QUARKUS_DATASOURCE_PASSWORD: 'onecx_user_profile',
      QUARKUS_DATASOURCE_JDBC_URL: `jdbc:postgresql://${postgresContainerName}:5432/onecx_user_profile?sslmode=disable`,
      ...commonEnv,
      ...svcEnv
    })
    .withHealthCheck({
      test: ['CMD-SHELL', `curl --head -fsS http://localhost:8080/q/health`],
      interval: 10_000,
      timeout: 5_000,
      retries: 3
    })
    .withNetwork(network)
    .withExposedPorts(8080)
    .withWaitStrategy(Wait.forHealthCheck())
    .withLogConsumer((stream) => {
      stream.on('data', (line) => console.log(`${containerName}: `, line))
      stream.on('err', (line) => console.error(`${containerName}: `, line))
      stream.on('end', () => console.log(`${containerName}: Stream closed`))
    })
    .start()
  logStarted(container, 8080)
  return container
}

// onecx-iam-kc-svc:
//     labels:
//       - "traefik.http.services.onecx-iam-kc-svc.loadbalancer.server.port=8080"
//       - "traefik.http.routers.onecx-iam-kc-svc.rule=Host(`onecx-iam-kc-svc`)"
async function setupIamKcSvc(containerName: string, network: StartedNetwork): Promise<StartedTestContainer> {
  logStart('container', containerName)
  const container = await new GenericContainer(process.env.ONECX_IAM_KC_SVC!)
    .withName(containerName)
    .withEnvironment({
      QUARKUS_KEYCLOAK_ADMIN_CLIENT_SERVER_URL: 'http://keycloak-app:8080',
      QUARKUS_KEYCLOAK_ADMIN_CLIENT_REALM: 'master',
      QUARKUS_KEYCLOAK_ADMIN_CLIENT_USERNAME: 'admin',
      QUARKUS_KEYCLOAK_ADMIN_CLIENT_PASSWORD: 'admin',
      ...commonEnv,
      ...svcEnv
    })
    .withHealthCheck({
      test: ['CMD-SHELL', `curl --head -fsS http://localhost:8080/q/health`],
      interval: 10_000,
      timeout: 5_000,
      retries: 3
    })
    .withNetwork(network)
    .withExposedPorts(8080)
    .withWaitStrategy(Wait.forHealthCheck())
    .withLogConsumer((stream) => {
      stream.on('data', (line) => console.log(`${containerName}: `, line))
      stream.on('err', (line) => console.error(`${containerName}: `, line))
      stream.on('end', () => console.log(`${containerName}: Stream closed`))
    })
    .start()
  logStarted(container, 8080)
  return container
}

// onecx-tenant-svc:
//     labels:
//       - "traefik.http.services.onecx-tenant-svc.loadbalancer.server.port=8080"
//       - "traefik.http.routers.onecx-tenant-svc.rule=Host(`onecx-tenant-svc`)"
async function setupTenantSvc(
  containerName: string,
  network: StartedNetwork,
  postgresContainerName: string
): Promise<StartedTestContainer> {
  logStart('container', containerName)
  const container = await new GenericContainer(process.env.ONECX_TENANT_SVC!)
    .withName(containerName)
    .withEnvironment({
      QUARKUS_DATASOURCE_USERNAME: 'onecx_tenant',
      QUARKUS_DATASOURCE_PASSWORD: 'onecx_tenant',
      QUARKUS_DATASOURCE_JDBC_URL: `jdbc:postgresql://${postgresContainerName}:5432/onecx_tenant?sslmode=disable`,
      ...commonEnv,
      ...svcEnv
    })
    .withHealthCheck({
      test: ['CMD-SHELL', `curl --head -fsS http://localhost:8080/q/health`],
      interval: 10_000,
      timeout: 5_000,
      retries: 3
    })
    .withNetwork(network)
    .withExposedPorts(8080)
    .withWaitStrategy(Wait.forHealthCheck())
    .withLogConsumer((stream) => {
      stream.on('data', (line) => console.log(`${containerName}: `, line))
      stream.on('err', (line) => console.error(`${containerName}: `, line))
      stream.on('end', () => console.log(`${containerName}: Stream closed`))
    })
    .start()
  logStarted(container, 8080)
  return container
}

// onecx-workspace-svc:
//     user: root
//     labels:
//       - "traefik.http.services.onecx-workspace-svc.loadbalancer.server.port=8080"
//       - "traefik.http.routers.onecx-workspace-svc.rule=Host(`onecx-workspace-svc`)"
async function setupWorkspaceSvc(
  containerName: string,
  network: StartedNetwork,
  postgresContainerName: string
): Promise<StartedTestContainer> {
  logStart('container', containerName)
  const container = await new GenericContainer(process.env.ONECX_WORKSPACE_SVC!)
    .withName(containerName)
    .withEnvironment({
      QUARKUS_DATASOURCE_USERNAME: 'onecx_workspace',
      QUARKUS_DATASOURCE_PASSWORD: 'onecx_workspace',
      QUARKUS_DATASOURCE_JDBC_URL: `jdbc:postgresql://${postgresContainerName}:5432/onecx_workspace?sslmode=disable`,
      TKIT_RS_CONTEXT_TENANT_ID_ENABLED: 'false',
      ...commonEnv,
      ...svcEnv
    })
    .withHealthCheck({
      test: ['CMD-SHELL', `curl --head -fsS http://localhost:8080/q/health`],
      interval: 10_000,
      timeout: 5_000,
      retries: 3
    })
    .withNetwork(network)
    .withExposedPorts(8080)
    .withWaitStrategy(Wait.forHealthCheck())
    .withLogConsumer((stream) => {
      stream.on('data', (line) => console.log(`${containerName}: `, line))
      stream.on('err', (line) => console.error(`${containerName}: `, line))
      stream.on('end', () => console.log(`${containerName}: Stream closed`))
    })
    .start()
  logStarted(container, 8080)
  return container
}

// onecx-shell-bff:
//     labels:
//       - "traefik.http.services.onecx-shell-bff.loadbalancer.server.port=8080"
//       - "traefik.http.routers.onecx-shell-bff.rule=Host(`onecx-shell-bff`)"
async function setupShellBff(containerName: string, network: StartedNetwork): Promise<StartedTestContainer> {
  logStart('container', containerName)
  const container = await new GenericContainer(process.env.ONECX_SHELL_BFF!)
    .withName(containerName)
    .withEnvironment({
      ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-shell',
      ...commonEnv,
      ...bffEnv
    })
    .withHealthCheck({
      test: ['CMD-SHELL', `curl --head -fsS http://localhost:8080/q/health`],
      interval: 10_000,
      timeout: 5_000,
      retries: 3,
      startPeriod: 10_000
    })
    .withNetwork(network)
    .withExposedPorts(8080)
    .withWaitStrategy(Wait.forHealthCheck())
    .withLogConsumer((stream) => {
      stream.on('data', (line) => console.log(`${containerName}: `, line))
      stream.on('err', (line) => console.error(`${containerName}: `, line))
      stream.on('end', () => console.log(`${containerName}: Stream closed`))
    })
    .start()
  logStarted(container, 8080)
  return container
}

// onecx-shell-ui:
//     labels:
//       - "traefik.http.services.onecx-shell-ui.loadbalancer.server.port=8080"
//       - "traefik.http.routers.onecx-shell-ui.rule=Host(`local-proxy`)&&PathPrefix(`/onecx-shell/`)"
async function setupShellUi(
  containerName: string,
  network: StartedNetwork,
  keycloakContainer: StartedTestContainer,
  shellBffContainer: StartedTestContainer
): Promise<StartedTestContainer> {
  logStart('container', containerName)
  const container = await new GenericContainer(process.env.ONECX_SHELL_UI!)
    .withName(containerName)
    .withEnvironment({
      ONECX_PERMISSIONS_ENABLED: 'true',
      ONECX_PERMISSIONS_CACHE_ENABLED: 'false',
      ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-shell',
      APP_BASE_HREF: '/onecx-shell/',
      KEYCLOAK_URL: `http://localhost:${keycloakContainer.getMappedPort(8080)}`,
      ONECX_VAR_REMAP: 'KEYCLOAK_REALM=KC_REALM;KEYCLOAK_CLIENT_ID=CLIENT_USER_ID',
      CLIENT_USER_ID: 'onecx-shell-ui-client',
      BFF_URL: `http://localhost:${shellBffContainer.getMappedPort(8080)}`,
      ...commonEnv
    })
    .withNetwork(network)
    .withExposedPorts(8080)
    .withLogConsumer((stream) => {
      stream.on('data', (line) => console.log(`${containerName}: `, line))
      stream.on('err', (line) => console.error(`${containerName}: `, line))
      stream.on('end', () => console.log(`${containerName}: Stream closed`))
    })
    .start()
  logStarted(container, 8080)
  return container
}

async function checkDbExistence(postgres: StartedTestContainer) {
  const { output, stdout, stderr, exitCode } = await postgres.exec([
    'psql',
    '-U',
    'postgres',
    '-tc',
    `SELECT datname FROM pg_database`
  ])

  if (exitCode === 0) {
    console.log('List of databases:')
    console.log(stdout)
  } else {
    console.error(`Error listing databases: ${stderr}`)
  }

  const databases = [
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

  for (const db of databases) {
    const { output, stdout, stderr, exitCode } = await postgres.exec([
      'psql',
      '-U',
      db,
      '-tc',
      `SELECT 1 FROM pg_database WHERE datname='${db}'`
    ])
    if (stdout.trim() === '1') {
      console.log(`Database ${db} exists.`)
    } else {
      console.error(`Database ${db} does not exist.`)
    }
  }
}

interface importConfig {
  THEME_SVC_PORT: number
  PERMISSION_SVC_PORT: number
  PRODUCT_STORE_SVC_PORT: number
  USER_PROFILE_SVC_PORT: number
  IAM_KC_SVC_PORT: number
  TENANT_SVC_PORT: number
  WORKSPACE_SVC_PORT: number
}

async function importOnecx(config: importConfig) {
  return new Promise((resolve, reject) => {
    const variables = Object.keys(config).reduce((acc, key) => acc + `${key}=${config[key]} `, '')
    exec(`cd e2e-tests; ${variables} . ./import-onecx.sh; cd ..`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error importing OneCX: ${error.message}`)
        console.error(`Error output:\n${stdout}`)
        return reject(error)
      }
      console.log(`OneCX import output:\n${stdout}`)
      if (stderr) {
        console.error(`OneCX import errors:\n${stderr}`)
      }
      resolve(null)
    })
  })
}

// TODO: Make variables for container names
// TODO: Whenever something is not correctly set up, script should teardown and fail
// TODO: Most of the containers should be taken into separate lib
// TODO: Create lib with custom classes to extend test containers
// TODO: Use .env for container images
async function setup() {
  console.log('starting e2e tests setup')

  logStart('network')
  const network = await new Network().start()
  logStarted(network)

  const postgresName = 'postgresdb'
  const postgresDbContainer = await setupPostgres(postgresName, network)

  await checkDbExistence(postgresDbContainer)

  const keycloak = 'keycloak-app'
  const keycloakContainer = await setupKeycloak(keycloak, network)

  commonEnv['QUARKUS_OIDC_AUTH_SERVER_URL'] = `http://localhost:${keycloakContainer.getMappedPort(8080)}/realms/onecx`
  commonEnv['QUARKUS_OIDC_TOKEN_ISSUER'] = `http://localhost:${keycloakContainer.getMappedPort(8080)}/realms/onecx`

  const theme_svc = 'onecx-theme-svc'
  const themeSvcContainer = await setupThemeSvc(theme_svc, network, postgresName)

  const permission_svc = 'onecx-permission-svc'
  const permissionSvcContainer = await setupPermissionSvc(permission_svc, network, postgresName)

  const product_store_svc = 'onecx-product-store-svc'
  const productStoreSvcContainer = await setupProductStoreSvc(product_store_svc, network, postgresName)

  const user_profile_svc = 'onecx-user-profile-svc'
  const userProfileSvcContainer = await setupUserProfileSvc(user_profile_svc, network, postgresName)

  const iam_kc_svc = 'onecx-iam-kc-svc'
  const iamKcSvcContainer = await setupIamKcSvc(iam_kc_svc, network)

  const tenant_svc = 'onecx-tenant-svc'
  const tenantSvcContainer = await setupTenantSvc(tenant_svc, network, postgresName)

  const workspace_svc = 'onecx-workspace-svc'
  const workspaceSvcContainer = await setupWorkspaceSvc(workspace_svc, network, postgresName)

  await importOnecx({
    THEME_SVC_PORT: themeSvcContainer.getMappedPort(8080),
    PERMISSION_SVC_PORT: permissionSvcContainer.getMappedPort(8080),
    PRODUCT_STORE_SVC_PORT: productStoreSvcContainer.getMappedPort(8080),
    USER_PROFILE_SVC_PORT: userProfileSvcContainer.getMappedPort(8080),
    IAM_KC_SVC_PORT: iamKcSvcContainer.getMappedPort(8080),
    TENANT_SVC_PORT: tenantSvcContainer.getMappedPort(8080),
    WORKSPACE_SVC_PORT: workspaceSvcContainer.getMappedPort(8080)
  })

  // TODO: Start Shell
  const shell_bff = 'onecx-shell-bff'
  const shellBffContainer = await setupShellBff(shell_bff, network)

  const shell_ui = 'onecx-shell-ui'
  const shellUiContainer = await setupShellUi(shell_ui, network, keycloakContainer, shellBffContainer)
  // // TODO: Start BFFs
  // const theme_bff = 'onecx-theme-bff'
  // const themeBffContainer = await setupThemeBff(theme_bff, network)

  // const permission_svc = 'onecx-permission-svc'
  // const permissionSvcContainer = await setupPermissionSvc(permission_svc, network, postgresName)

  // const product_store_svc = 'onecx-product-store-svc'
  // const productStoreSvcContainer = await setupProductStoreSvc(product_store_svc, network, postgresName)

  // const user_profile_svc = 'onecx-user-profile-svc'
  // const userProfileSvcContainer = await setupUserProfileSvc(user_profile_svc, network, postgresName)

  // const iam_kc_svc = 'onecx-iam-kc-svc'
  // const iamKcSvcContainer = await setupIamKcSvc(iam_kc_svc, network)

  // const tenant_svc = 'onecx-tenant-svc'
  // const tenantSvcContainer = await setupTenantSvc(tenant_svc, network, postgresName)

  // const workspace_svc = 'onecx-workspace-svc'
  // const workspaceSvcContainer = await setupWorkspaceSvc(workspace_svc, network, postgresName)
  // TODO: Start UIs

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
      ...[shellBffContainer],
      ...[shellUiContainer],
      network
    ],
    uiPort: shellUiContainer.getMappedPort(8080),
    keycloakPort: keycloakContainer.getMappedPort(8080)
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

async function runCypressTests(uiPort: number, keycloakPort: number) {
  return new Promise((resolve, reject) => {
    exec(
      `npx cypress run --spec "cypress/e2e/**/*.cy.ts" --env PORT=${uiPort},KEYCLOAK_PORT=${keycloakPort}`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error running Cypress tests: ${error.message}`)
          console.error(`Error tests output:\n${stdout}`)
          return reject(error)
        }
        console.log(`Cypress tests output:\n${stdout}`)
        if (stderr) {
          console.error(`Cypress tests errors:\n${stderr}`)
        }
        resolve(null)
      }
    )
  })
}

async function runTests() {
  const data = await setup()

  console.log('starting e2e tests')
  try {
    await runCypressTests(data.uiPort, data.keycloakPort)
    console.log('finishing e2e tests')
  } catch (error) {
    console.error('Cypress tests failed', error)
  } finally {
    await teardown(data.services)
  }
}

runTests().catch((err) => console.error(err))

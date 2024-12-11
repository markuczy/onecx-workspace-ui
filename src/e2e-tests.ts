import { exec } from 'child_process'
import { GenericContainer, Network, StartedNetwork, StartedTestContainer, Wait } from 'testcontainers'
import * as path from 'path'

type ResourceType = 'container' | 'network'
type StartedResource = StartedNetwork | StartedTestContainer

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

async function setupPostgres(containerName: string, network: StartedNetwork): Promise<StartedTestContainer> {
  logStart('container', containerName)
  const startedContainer = await new GenericContainer('docker.io/library/postgres:13.4')
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

async function setupKeycloak(containerName: string, network: StartedNetwork): Promise<StartedTestContainer> {
  logStart('container', containerName)
  const startedContainer = await new GenericContainer('quay.io/keycloak/keycloak:23.0.4')
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
      KC_HOSTNAME: 'keycloak-app',
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

  // postgresdb:
  //   depends_on:
  //     traefik:
  //       condition: service_started
  //   labels:
  //     - "traefik.http.services.postgresdb.loadbalancer.server.port=5432"
  //     - "traefik.http.routers.postgresdb.rule=Host(`postgresdb`)"
  const postgresName = 'postgresdb'
  const postgresDbContainer = await setupPostgres(postgresName, network)

  await checkDbExistence(postgresDbContainer)

  // keycloak-app:
  //   depends_on:
  //     postgresdb:
  //       condition: service_healthy
  //   labels:
  //     - "traefik.http.services.keycloak-intranet.loadbalancer.server.port=8080"
  //     - "traefik.http.routers.keycloak-intranet.rule=Host(`keycloak-app`)"
  const keycloak = 'keycloak-app'
  const keycloakContainer = await setupKeycloak(keycloak, network)

  // onecx-theme-svc:
  //   image: ${ONECX_THEME_SVC}
  //   environment:
  //     QUARKUS_DATASOURCE_USERNAME: onecx_theme
  //     QUARKUS_DATASOURCE_PASSWORD: onecx_theme
  //     QUARKUS_DATASOURCE_JDBC_URL: "jdbc:postgresql://postgresdb:5432/onecx_theme?sslmode=disable"
  //   healthcheck:
  //     test: curl --head -fsS http://localhost:8080/q/health
  //     interval: 10s
  //     timeout: 5s
  //     retries: 3
  //   depends_on:
  //     postgresdb:
  //       condition: service_healthy
  //   labels:
  //     - "traefik.http.services.onecx-theme-svc.loadbalancer.server.port=8080"
  //     - "traefik.http.routers.onecx-theme-svc.rule=Host(`onecx-theme-svc`)"
  //   env_file:
  //     - common.env
  //     - svc.env
  //   networks:
  //     - example
  // const theme_svc = 'onecx-theme-svc'
  // logStart('container', theme_svc)
  // const themeSvcContainer = await new GenericContainer('ghcr.io/onecx')
  //   .withName(keycloak)
  //   .withCommand(['start-dev', '--import-realm'])
  //   .withEnvironment({
  //     KEYCLOAK_ADMIN: 'admin',
  //     KEYCLOAK_ADMIN_PASSWORD: 'admin',
  //     KC_DB: 'postgres',
  //     KC_DB_POOL_INITIAL_SIZE: '1',
  //     KC_DB_POOL_MAX_SIZE: '5',
  //     KC_DB_POOL_MIN_SIZE: '2',
  //     KC_DB_URL_DATABASE: 'keycloak',
  //     KC_DB_URL_HOST: 'postgresdb',
  //     KC_DB_USERNAME: 'keycloak',
  //     KC_DB_PASSWORD: 'keycloak',
  //     KC_HOSTNAME: 'keycloak-app',
  //     KC_HOSTNAME_STRICT: 'false',
  //     KC_HTTP_ENABLED: 'true',
  //     KC_HTTP_PORT: '8080',
  //     KC_HEALTH_ENABLED: 'true'
  //   })
  //   .withHealthCheck({
  //     test: [
  //       'CMD-SHELL',
  //       `{ printf >&3 'GET /realms/onecx/.well-known/openid-configuration HTTP/1.0\\r\\nHost: localhost\\r\\n\\r\\n'; cat <&3; } 3<>/dev/tcp/localhost/8080 | head -1 | grep 200`
  //     ],
  //     interval: 10_000,
  //     timeout: 5_000,
  //     retries: 10
  //   })
  //   .withNetwork(network)
  //   .withExposedPorts(8080)
  //   .withCopyDirectoriesToContainer([
  //     {
  //       source: path.resolve('e2e-tests/init-data/keycloak/imports'),
  //       target: '/opt/keycloak/data/import'
  //     }
  //   ])
  //   .withStartupTimeout(100_000)
  //   .withLogConsumer((stream) => {
  //     stream.on('data', (line) => console.log(`${keycloak}: `, line))
  //     stream.on('err', (line) => console.error(`${keycloak}: `, line))
  //     stream.on('end', () => console.log(`${keycloak}: Stream closed`))
  //   })
  //   .start()
  // logStarted(keycloakContainer, 8080)

  console.log('finishing e2e tests setup')
  return [postgresDbContainer, keycloakContainer, network]
}

async function teardown(services: Array<StartedNetwork | StartedTestContainer>) {
  console.log('starting e2e tests teardown')
  for (const s of services) {
    await s.stop()
    logStopped(s)
  }
  console.log('finishing e2e tests teardown')
}

async function runCypressTests() {
  return new Promise((resolve, reject) => {
    exec('npx cypress run --spec "cypress/e2e/**/*.cy.ts"', (error, stdout, stderr) => {
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
    })
  })
}

async function runTests() {
  const services = await setup()

  console.log('starting e2e tests')
  try {
    // await runCypressTests()
    console.log('finishing e2e tests')
  } catch (error) {
    console.error('Cypress tests failed', error)
  } finally {
    await teardown(services)
  }
}

runTests().catch((err) => console.error(err))

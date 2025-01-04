import { StartedNetwork, StartedTestContainer } from 'testcontainers'
import { commonEnv } from '../constants/e2e-config'
import { OneCXContainer, StartedOneCXContainer } from '../abstract/onecx-container'
import { StartedOneCXPostgresContainer } from './onecx-postgres'

export interface OneCXKeycloakDetails {
  onecxRealm: string
  adminRealm: string
  adminUsername: string
  adminPassword: string
}

export class OneCXKeycloakContainer extends OneCXContainer {
  private onecxStartCommand: string[]
  private onecxKeycloakDetails: OneCXKeycloakDetails = {
    onecxRealm: commonEnv.KC_REALM,
    adminRealm: 'master',
    adminUsername: 'admin',
    adminPassword: 'admin'
  }
  private onecxStartTimeout: number = 100_000

  constructor(
    image: string,
    network: StartedNetwork,
    private readonly databaseContainer: StartedOneCXPostgresContainer,
    private readonly initDataPath?: string
  ) {
    const alias = 'keycloak-app'
    const port = 8080
    super(image, alias, network)

    this.withOneCXRealm(commonEnv.KC_REALM)
      .withOneCXEnvironment({
        KEYCLOAK_ADMIN: this.onecxKeycloakDetails.adminUsername,
        KEYCLOAK_ADMIN_PASSWORD: this.onecxKeycloakDetails.adminPassword,
        KC_DB: 'postgres',
        KC_DB_POOL_INITIAL_SIZE: '1',
        KC_DB_POOL_MAX_SIZE: '5',
        KC_DB_POOL_MIN_SIZE: '2',
        KC_DB_URL_DATABASE: 'keycloak',
        KC_DB_URL_HOST: `${databaseContainer.getOneCXAlias()}`,
        KC_DB_USERNAME: 'keycloak',
        KC_DB_PASSWORD: 'keycloak',
        KC_HOSTNAME: `${alias}`,
        KC_HOSTNAME_STRICT: 'false',
        KC_HTTP_ENABLED: 'true',
        KC_HTTP_PORT: `${port}`,
        KC_HEALTH_ENABLED: 'true'
      })
      .withOneCXHealthCheck({
        test: [
          'CMD-SHELL',
          `{ printf >&3 'GET /realms/${this.getOneCXRealm()}/.well-known/openid-configuration HTTP/1.0\\r\\nHost: localhost\\r\\n\\r\\n'; cat <&3; } 3<>/dev/tcp/localhost/${port} | head -1 | grep 200`
        ],
        interval: 10_000,
        timeout: 5_000,
        retries: 10
      })
      .withOneCXStartCommand(['start-dev', '--import-realm'])
      .withOneCXExposedPort(port)
  }

  public withOneCXNameAndAlias(nameAndAlias: string): this {
    super.withOneCXNameAndAlias(nameAndAlias)

    this.updateEnv()
    return this
  }

  public withOneCXExposedPort(port: number): this {
    super.withOneCXExposedPort(port)

    this.updateEnv()

    this.updateHealthCheck()
    return this
  }

  public withOneCXStartCommand(startCommand: string[]) {
    this.onecxStartCommand = startCommand
    return this
  }

  public getOneCXStartCommand() {
    return this.onecxStartCommand
  }

  public withOneCXStartupTimeout(timeout: number) {
    this.onecxStartTimeout = timeout
  }

  public withOneCXRealm(realm: string) {
    this.onecxKeycloakDetails.onecxRealm = realm
    return this
  }

  public getOneCXRealm() {
    return this.onecxKeycloakDetails.onecxRealm
  }

  public withOneCXAdminRealm(realm: string) {
    this.onecxKeycloakDetails.adminRealm = realm
    return this
  }

  public withOneCXAdminUsername(username: string) {
    this.onecxKeycloakDetails.adminUsername = username
    return this
  }

  public withOneCXAdminPassword(password: string) {
    this.onecxKeycloakDetails.adminPassword = password
    return this
  }

  async start(): Promise<StartedOneCXKeycloakContainer> {
    this.withCommand(this.onecxStartCommand).withStartupTimeout(this.onecxStartTimeout)

    if (this.initDataPath) {
      this.withCopyDirectoriesToContainer([
        {
          source: this.initDataPath,
          target: '/opt/keycloak/data/import'
        }
      ])
    }

    return new StartedOneCXKeycloakContainer(
      await super.start(),
      this.getOneCXAlias(),
      this.getOneCXNetwork(),
      this.onecxKeycloakDetails,
      this.getOneCXExposedPort()
    )
  }

  private updateEnv() {
    this.withOneCXEnvironment({
      KEYCLOAK_ADMIN: this.onecxKeycloakDetails.adminUsername,
      KEYCLOAK_ADMIN_PASSWORD: this.onecxKeycloakDetails.adminPassword,
      KC_DB: 'postgres',
      KC_DB_POOL_INITIAL_SIZE: '1',
      KC_DB_POOL_MAX_SIZE: '5',
      KC_DB_POOL_MIN_SIZE: '2',
      KC_DB_URL_DATABASE: 'keycloak',
      KC_DB_URL_HOST: `${this.databaseContainer.getOneCXAlias()}`,
      KC_DB_USERNAME: 'keycloak',
      KC_DB_PASSWORD: 'keycloak',
      KC_HOSTNAME: `${this.getOneCXAlias()}`,
      KC_HOSTNAME_STRICT: 'false',
      KC_HTTP_ENABLED: 'true',
      KC_HTTP_PORT: `${this.getOneCXExposedPort()}`,
      KC_HEALTH_ENABLED: 'true'
    })
  }

  private updateHealthCheck() {
    this.withOneCXHealthCheck({
      test: [
        'CMD-SHELL',
        `{ printf >&3 'GET /realms/${this.getOneCXRealm()}/.well-known/openid-configuration HTTP/1.0\\r\\nHost: localhost\\r\\n\\r\\n'; cat <&3; } 3<>/dev/tcp/localhost/${this.getOneCXExposedPort()} | head -1 | grep 200`
      ],
      interval: 10_000,
      timeout: 5_000,
      retries: 10
    })
  }
}

export class StartedOneCXKeycloakContainer extends StartedOneCXContainer {
  constructor(
    startedTestContainer: StartedTestContainer,
    alias: string,
    network: StartedNetwork,
    private readonly onecxKeycloakDetails: OneCXKeycloakDetails,
    exposedPort: number | undefined
  ) {
    super(startedTestContainer, alias, network, exposedPort)
  }

  public getOneCXRealm() {
    return this.onecxKeycloakDetails.onecxRealm
  }

  public getOneCXAdminRealm() {
    return this.onecxKeycloakDetails.adminRealm
  }

  public getOneCXAdminUsername() {
    return this.onecxKeycloakDetails.adminUsername
  }

  public getOneCXAdminPassword() {
    return this.onecxKeycloakDetails.adminPassword
  }
}

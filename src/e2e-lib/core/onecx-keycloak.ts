import { StartedNetwork, StartedTestContainer } from 'testcontainers'
import { commonEnv } from '../constants/e2e-config'
import { OneCXContainer, StartedOneCXContainer } from '../abstract/onecx-container'
import { StartedOneCXPostgresContainer } from './onecx-postgres'

export class OneCXKeycloakContainer extends OneCXContainer {
  private onecxStartCommand: string[]
  private onecxRealm: string
  private onecxStartTimeout: number
  private onecxAdminRealm = 'master'
  private onecxAdminUsername = 'admin'
  private onecxAdminPassword = 'admin'

  constructor(
    image: string,
    network: StartedNetwork,
    databaseContainer: StartedOneCXPostgresContainer,
    private readonly initDataPath?: string
  ) {
    const alias = 'keycloak-app'
    const port = 8080
    super(image, alias, network)

    this.withOneCXRealm(commonEnv.KC_REALM)
      .withStartupTimeout(100_000)
      .withOneCXEnvironment({
        KEYCLOAK_ADMIN: 'admin',
        KEYCLOAK_ADMIN_PASSWORD: 'admin',
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
    this.onecxRealm = realm
    return this
  }

  public getOneCXRealm() {
    return this.onecxRealm
  }

  public withOneCXAdminRealm(realm: string) {
    this.onecxAdminRealm = realm
    return this
  }

  public withOneCXAdminUsername(username: string) {
    this.onecxAdminUsername = username
    return this
  }

  public withOneCXAdminPassword(password: string) {
    this.onecxAdminPassword = password
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
      this.onecxRealm,
      this.onecxAdminRealm,
      this.onecxAdminUsername,
      this.onecxAdminPassword
    )
  }
}

export class StartedOneCXKeycloakContainer extends StartedOneCXContainer {
  constructor(
    startedTestContainer: StartedTestContainer,
    alias: string,
    private readonly onecxRealm: string,
    private readonly onecxAdminRealm: string,
    private readonly onecxAdminUsername: string,
    private readonly onecxAdminPassword: string
  ) {
    super(startedTestContainer, alias)
  }

  public getOneCXRealm() {
    return this.onecxRealm
  }

  public getOneCXAdminRealm() {
    return this.onecxAdminRealm
  }

  public getOneCXAdminUsername() {
    return this.onecxAdminUsername
  }

  public getOneCXAdminPassword() {
    return this.onecxAdminPassword
  }
}

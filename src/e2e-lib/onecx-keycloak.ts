import { StartedNetwork, StartedTestContainer } from 'testcontainers'
import { commonEnv } from './e2e-config'
import { OneCXContainer, StartedOneCXContainer } from './onecx-container'

export class OneCXKeycloakContainer extends OneCXContainer {
  private onecxStartCommand: string[]
  private onecxRealm: string
  private onecxStartTimeout: number

  constructor(
    image: string,
    network: StartedNetwork,
    private readonly initDataPath?: string
  ) {
    super(image, network)

    this.withOneCXNameAndAlias('keycloak-app')
      .withOneCXRealm(commonEnv.KC_REALM)
      .withStartupTimeout(100_000)
      .withOneCXEnvironment({
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
      .withOneCXHealthCheck({
        test: [
          'CMD-SHELL',
          `{ printf >&3 'GET /realms/${this.getOneCXRealm()}/.well-known/openid-configuration HTTP/1.0\\r\\nHost: localhost\\r\\n\\r\\n'; cat <&3; } 3<>/dev/tcp/localhost/8080 | head -1 | grep 200`
        ],
        interval: 10_000,
        timeout: 5_000,
        retries: 10
      })
      .withOneCXStartCommand(['start-dev', '--import-realm'])
      .withOneCXExposedPort(8080)
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

    return new StartedOneCXKeycloakContainer(await super.start(), this.getOneCXAlias())
  }
}

export class StartedOneCXKeycloakContainer extends StartedOneCXContainer {
  constructor(startedTestContainer: StartedTestContainer, alias?: string) {
    super(startedTestContainer, alias)
  }
}

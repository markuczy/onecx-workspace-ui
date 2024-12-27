import { StartedNetwork } from 'testcontainers'
import { OneCXSvcContainer, StartedOneCXSvcContainer } from '../abstract/onecx-svc'
import { StartedOneCXPostgresContainer } from '../core/onecx-postgres'
import { StartedOneCXKeycloakContainer } from '../core/onecx-keycloak'

export class OneCXThemeSvcContainer extends OneCXSvcContainer {
  constructor(
    image: string,
    network: StartedNetwork,
    databaseContainer: StartedOneCXPostgresContainer,
    keycloakContainer: StartedOneCXKeycloakContainer
  ) {
    super(image, 'onecx-theme-svc', 'theme', network, databaseContainer, keycloakContainer)

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      QUARKUS_DATASOURCE_USERNAME: 'onecx_theme',
      QUARKUS_DATASOURCE_PASSWORD: 'onecx_theme',
      QUARKUS_DATASOURCE_JDBC_URL: `jdbc:postgresql://${this.getOneCXDatabaseContainerName()}:${this.getOneCXDatabaseExposedPort}/onecx_theme?sslmode=disable`
    })
  }

  async start(): Promise<StartedOneCXThemeSvcContainer> {
    return new StartedOneCXThemeSvcContainer(
      await super.start(),
      this.getOneCXAppType(),
      this.getOneCXApplicationName(),
      this.getOneCXAlias()
    )
  }
}

export class StartedOneCXThemeSvcContainer extends StartedOneCXSvcContainer {}

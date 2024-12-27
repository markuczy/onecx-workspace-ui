import { StartedNetwork } from 'testcontainers'
import { OneCXSvcContainer, StartedOneCXSvcContainer } from '../abstract/onecx-svc'
import { StartedOneCXPostgresContainer } from '../core/onecx-postgres'
import { StartedOneCXKeycloakContainer } from '../core/onecx-keycloak'

export class OneCXUserProfileSvcContainer extends OneCXSvcContainer {
  constructor(
    image: string,
    network: StartedNetwork,
    databaseContainer: StartedOneCXPostgresContainer,
    keycloakContainer: StartedOneCXKeycloakContainer
  ) {
    super(image, 'onecx-user-profile-svc', 'user-profile', network, databaseContainer, keycloakContainer)

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      QUARKUS_DATASOURCE_USERNAME: 'onecx_user_profile',
      QUARKUS_DATASOURCE_PASSWORD: 'onecx_user_profile',
      QUARKUS_DATASOURCE_JDBC_URL: `jdbc:postgresql://${this.getOneCXDatabaseContainerName()}:${this.getOneCXDatabaseExposedPort}/onecx_user_profile?sslmode=disable`
    })
  }

  async start(): Promise<StartedOneCXUserProfileSvcContainer> {
    return new StartedOneCXUserProfileSvcContainer(
      await super.start(),
      this.getOneCXAppType(),
      this.getOneCXApplicationName(),
      this.getOneCXAlias()
    )
  }
}

export class StartedOneCXUserProfileSvcContainer extends StartedOneCXSvcContainer {}

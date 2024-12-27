import { StartedNetwork } from 'testcontainers'
import { OneCXSvcContainer, StartedOneCXSvcContainer } from '../abstract/onecx-svc'
import { StartedOneCXPostgresContainer } from '../core/onecx-postgres'
import { StartedOneCXKeycloakContainer } from '../core/onecx-keycloak'

export class OneCXWorkspaceSvcContainer extends OneCXSvcContainer {
  constructor(
    image: string,
    network: StartedNetwork,
    databaseContainer: StartedOneCXPostgresContainer,
    keycloakContainer: StartedOneCXKeycloakContainer
  ) {
    super(image, 'onecx-workspace-svc', 'workspace', network, databaseContainer, keycloakContainer)

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      QUARKUS_DATASOURCE_USERNAME: 'onecx_workspace',
      QUARKUS_DATASOURCE_PASSWORD: 'onecx_workspace',
      QUARKUS_DATASOURCE_JDBC_URL: `jdbc:postgresql://${this.getOneCXDatabaseContainerName()}:${this.getOneCXDatabaseExposedPort}/onecx_workspace?sslmode=disable`,
      TKIT_RS_CONTEXT_TENANT_ID_ENABLED: 'false'
    })
  }

  async start(): Promise<StartedOneCXWorkspaceSvcContainer> {
    return new StartedOneCXWorkspaceSvcContainer(
      await super.start(),
      this.getOneCXAppType(),
      this.getOneCXApplicationName(),
      this.getOneCXAlias()
    )
  }
}

export class StartedOneCXWorkspaceSvcContainer extends StartedOneCXSvcContainer {}

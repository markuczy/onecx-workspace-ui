import { StartedNetwork } from 'testcontainers'
import { OneCXSvcContainer, StartedOneCXSvcContainer } from '../abstract/onecx-svc'
import { StartedOneCXPostgresContainer } from '../core/onecx-postgres'
import { StartedOneCXKeycloakContainer } from '../core/onecx-keycloak'

// TODO: Keycloak data static
export class OneCXIamKcSvcContainer extends OneCXSvcContainer {
  constructor(
    image: string,
    network: StartedNetwork,
    databaseContainer: StartedOneCXPostgresContainer,
    keycloakContainer: StartedOneCXKeycloakContainer
  ) {
    super(image, 'onecx-iam-kc-svc', 'iam', network, databaseContainer, keycloakContainer)

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      QUARKUS_KEYCLOAK_ADMIN_CLIENT_SERVER_URL: `http://${this.getOneCXKeycloakContainerName()}:${this.getOneCXKeycloakExposedPort()}`,
      QUARKUS_KEYCLOAK_ADMIN_CLIENT_REALM: 'master',
      QUARKUS_KEYCLOAK_ADMIN_CLIENT_USERNAME: 'admin',
      QUARKUS_KEYCLOAK_ADMIN_CLIENT_PASSWORD: 'admin'
    })
  }

  async start(): Promise<StartedOneCXIamKcSvcContainer> {
    return new StartedOneCXIamKcSvcContainer(
      await super.start(),
      this.getOneCXAppType(),
      this.getOneCXApplicationName(),
      this.getOneCXAlias()
    )
  }
}

export class StartedOneCXIamKcSvcContainer extends StartedOneCXSvcContainer {}

import { StartedNetwork } from 'testcontainers'
import { OneCXSvcContainer, StartedOneCXSvcContainer } from '../abstract/onecx-svc'
import { StartedOneCXPostgresContainer } from '../core/onecx-postgres'
import { StartedOneCXKeycloakContainer } from '../core/onecx-keycloak'

export class OneCXIamKcSvcContainer extends OneCXSvcContainer {
  constructor(
    image: string,
    network: StartedNetwork,
    databaseContainer: StartedOneCXPostgresContainer,
    keycloakContainer: StartedOneCXKeycloakContainer
  ) {
    super(image, 'onecx-iam-kc-svc', 'iam', 'iam-kc-svc', network, databaseContainer, keycloakContainer)

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      QUARKUS_KEYCLOAK_ADMIN_CLIENT_SERVER_URL: `http://${this.getOneCXKeycloakContainer().getOneCXAlias()}:${this.getOneCXKeycloakContainer().getOneCXExposedPort()}`,
      QUARKUS_KEYCLOAK_ADMIN_CLIENT_REALM: `${this.getOneCXKeycloakContainer().getOneCXAdminRealm()}`,
      QUARKUS_KEYCLOAK_ADMIN_CLIENT_USERNAME: `${this.getOneCXKeycloakContainer().getOneCXAdminUsername()}`,
      QUARKUS_KEYCLOAK_ADMIN_CLIENT_PASSWORD: `${this.getOneCXKeycloakContainer().getOneCXAdminPassword()}`
    })
  }
}

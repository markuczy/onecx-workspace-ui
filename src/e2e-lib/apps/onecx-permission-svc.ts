import { StartedNetwork } from 'testcontainers'
import { OneCXSvcContainer, StartedOneCXSvcContainer } from '../abstract/onecx-svc'
import { StartedOneCXPostgresContainer } from '../core/onecx-postgres'
import { StartedOneCXKeycloakContainer } from '../core/onecx-keycloak'
import { OneCXTenantSvcContainer, StartedOneCXTenantSvcContainer } from './onecx-tenant-svc'

export class OneCXPermissionSvcContainer extends OneCXSvcContainer {
  constructor(
    image: string,
    network: StartedNetwork,
    databaseContainer: StartedOneCXPostgresContainer,
    keycloakContainer: StartedOneCXKeycloakContainer,
    tenantContainer: StartedOneCXTenantSvcContainer | OneCXTenantSvcContainer
  ) {
    super(image, 'onecx-permission-svc', 'permission', 'permission-svc', network, databaseContainer, keycloakContainer)

    this.withOneCXNameAndAlias('onecx-permission-svc').withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      QUARKUS_DATASOURCE_USERNAME: 'onecx_permission',
      QUARKUS_DATASOURCE_PASSWORD: 'onecx_permission',
      QUARKUS_DATASOURCE_JDBC_URL: `jdbc:postgresql://${this.getOneCXDatabaseContainer().getOneCXAlias()}:${this.getOneCXDatabaseContainer().getOneCXExposedPort()}/onecx_permission?sslmode=disable`,
      QUARKUS_REST_CLIENT_ONECX_TENANT_URL: `http://${tenantContainer.getOneCXAlias()}:${tenantContainer.getOneCXExposedPort()}`,
      ONECX_PERMISSION_TOKEN_VERIFIED: 'false',
      TKIT_RS_CONTEXT_TENANT_ID_ENABLED: 'false'
    })
  }
}

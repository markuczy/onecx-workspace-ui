import { StartedNetwork } from 'testcontainers'
import { OneCXSvcContainer, StartedOneCXSvcContainer } from './onecx-svc'

// TODO: Username and password is bounded to the db create scripts
// TODO: JDBC URL improvement??
// TODO: tenant container name is static
export class OneCXPermissionSvcContainer extends OneCXSvcContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, network)

    this.withOneCXNameAndAlias('onecx-permission-svc').withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      QUARKUS_DATASOURCE_USERNAME: 'onecx_permission',
      QUARKUS_DATASOURCE_PASSWORD: 'onecx_permission',
      QUARKUS_DATASOURCE_JDBC_URL: `jdbc:postgresql://${this.getOneCXDatabaseContainerName()}:5432/onecx_permission?sslmode=disable`,
      QUARKUS_REST_CLIENT_ONECX_TENANT_URL: 'http://onecx-tenant-svc:8080',
      ONECX_PERMISSION_TOKEN_VERIFIED: 'false',
      TKIT_RS_CONTEXT_TENANT_ID_ENABLED: 'false'
    })
  }

  async start(): Promise<StartedOneCXPermissionSvcContainer> {
    return new StartedOneCXPermissionSvcContainer(await super.start(), this.getOneCXAppType(), this.getOneCXAlias())
  }
}

export class StartedOneCXPermissionSvcContainer extends StartedOneCXSvcContainer {}

import { StartedNetwork } from 'testcontainers'
import { OneCXSvcContainer, StartedOneCXSvcContainer } from './onecx-svc'

// TODO: Username and password is bounded to the db create scripts
// TODO: JDBC URL improvement??
export class OneCXTenantSvcContainer extends OneCXSvcContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, network)

    this.withOneCXNameAndAlias('onecx-tenant-svc').withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      QUARKUS_DATASOURCE_USERNAME: 'onecx_tenant',
      QUARKUS_DATASOURCE_PASSWORD: 'onecx_tenant',
      QUARKUS_DATASOURCE_JDBC_URL: `jdbc:postgresql://${this.getOneCXDatabaseContainerName()}:5432/onecx_tenant?sslmode=disable`
    })
  }

  async start(): Promise<StartedOneCXTenantSvcContainer> {
    return new StartedOneCXTenantSvcContainer(await super.start(), this.getOneCXAppType(), this.getOneCXAlias())
  }
}

export class StartedOneCXTenantSvcContainer extends StartedOneCXSvcContainer {}

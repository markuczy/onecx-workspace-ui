import { OneCXSvcContainer, OneCXSvcContainerServices } from '../abstract/onecx-svc'

export class OneCXTenantSvcContainer extends OneCXSvcContainer {
  constructor(image: string, services: OneCXSvcContainerServices) {
    super(image, { nameAndAlias: 'onecx-tenant-svc', applicationName: 'tenant', appId: 'tenant-svc' }, services)

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      QUARKUS_DATASOURCE_USERNAME: 'onecx_tenant',
      QUARKUS_DATASOURCE_PASSWORD: 'onecx_tenant',
      QUARKUS_DATASOURCE_JDBC_URL: `jdbc:postgresql://${this.getOneCXDatabaseContainer().getOneCXAlias()}:${this.getOneCXDatabaseContainer().getOneCXExposedPort()}/onecx_tenant?sslmode=disable`
    })
  }
}

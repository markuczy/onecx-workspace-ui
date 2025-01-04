import { OneCXSvcContainer, OneCXSvcContainerServices, StartedOneCXSvcContainer } from '../abstract/onecx-svc'

export interface OneCXPermissionSvcContainerServices extends OneCXSvcContainerServices {
  tenantContainer: OneCXSvcContainer | StartedOneCXSvcContainer
}

export class OneCXPermissionSvcContainer extends OneCXSvcContainer {
  constructor(image: string, services: OneCXPermissionSvcContainerServices) {
    super(
      image,
      { nameAndAlias: 'onecx-permission-svc', applicationName: 'permission', appId: 'permission-svc' },
      services
    )

    this.withOneCXNameAndAlias('onecx-permission-svc').withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      QUARKUS_DATASOURCE_USERNAME: 'onecx_permission',
      QUARKUS_DATASOURCE_PASSWORD: 'onecx_permission',
      QUARKUS_DATASOURCE_JDBC_URL: `jdbc:postgresql://${this.getOneCXDatabaseContainer().getOneCXAlias()}:${this.getOneCXDatabaseContainer().getOneCXExposedPort()}/onecx_permission?sslmode=disable`,
      QUARKUS_REST_CLIENT_ONECX_TENANT_URL: `http://${services.tenantContainer.getOneCXAlias()}:${services.tenantContainer.getOneCXExposedPort()}`,
      ONECX_PERMISSION_TOKEN_VERIFIED: 'false',
      TKIT_RS_CONTEXT_TENANT_ID_ENABLED: 'false'
    })
  }
}

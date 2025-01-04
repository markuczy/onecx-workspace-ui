import { OneCXSvcContainer, OneCXSvcContainerServices } from '../abstract/onecx-svc'

export class OneCXWorkspaceSvcContainer extends OneCXSvcContainer {
  constructor(image: string, services: OneCXSvcContainerServices) {
    super(
      image,
      {
        name: 'onecx-workspace-svc',
        alias: 'onecx-workspace-svc',
        applicationName: 'workspace',
        appId: 'workspace-svc'
      },
      services
    )

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      QUARKUS_DATASOURCE_USERNAME: 'onecx_workspace',
      QUARKUS_DATASOURCE_PASSWORD: 'onecx_workspace',
      QUARKUS_DATASOURCE_JDBC_URL: `jdbc:postgresql://${this.getOneCXDatabaseContainer().getOneCXAlias()}:${this.getOneCXDatabaseContainer().getOneCXExposedPort()}/onecx_workspace?sslmode=disable`,
      TKIT_RS_CONTEXT_TENANT_ID_ENABLED: 'false'
    })
  }
}

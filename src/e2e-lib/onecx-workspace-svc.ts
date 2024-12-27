import { StartedNetwork } from 'testcontainers'
import { OneCXSvcContainer, StartedOneCXSvcContainer } from './onecx-svc'

// TODO: Username and password is bounded to the db create scripts
// TODO: JDBC URL improvement??
export class OneCXWorkspaceSvcContainer extends OneCXSvcContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, network)

    this.withOneCXNameAndAlias('onecx-workspace-svc').withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      QUARKUS_DATASOURCE_USERNAME: 'onecx_workspace',
      QUARKUS_DATASOURCE_PASSWORD: 'onecx_workspace',
      QUARKUS_DATASOURCE_JDBC_URL: `jdbc:postgresql://${this.getOneCXDatabaseContainerName()}:5432/onecx_workspace?sslmode=disable`,
      TKIT_RS_CONTEXT_TENANT_ID_ENABLED: 'false'
    })
  }

  async start(): Promise<StartedOneCXWorkspaceSvcContainer> {
    return new StartedOneCXWorkspaceSvcContainer(await super.start(), this.getOneCXAppType(), this.getOneCXAlias())
  }
}

export class StartedOneCXWorkspaceSvcContainer extends StartedOneCXSvcContainer {}

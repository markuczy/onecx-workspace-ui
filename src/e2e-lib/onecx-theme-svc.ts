import { StartedNetwork } from 'testcontainers'
import { OneCXSvcContainer, StartedOneCXSvcContainer } from './onecx-svc'

// TODO: Username and password is bounded to the db create scripts
// TODO: JDBC URL improvement??
export class OneCXThemeSvcContainer extends OneCXSvcContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, network)

    this.withOneCXNameAndAlias('onecx-theme-svc').withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      QUARKUS_DATASOURCE_USERNAME: 'onecx_theme',
      QUARKUS_DATASOURCE_PASSWORD: 'onecx_theme',
      QUARKUS_DATASOURCE_JDBC_URL: `jdbc:postgresql://${this.getOneCXDatabaseContainerName()}:5432/onecx_theme?sslmode=disable`
    })
  }

  async start(): Promise<StartedOneCXThemeSvcContainer> {
    return new StartedOneCXThemeSvcContainer(await super.start(), this.getOneCXAppType(), this.getOneCXAlias())
  }
}

export class StartedOneCXThemeSvcContainer extends StartedOneCXSvcContainer {}

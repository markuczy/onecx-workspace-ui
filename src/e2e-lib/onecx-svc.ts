import { StartedNetwork } from 'testcontainers'
import { OneCXAppContainer, StartedOneCXAppContainer } from './onecx-app'
import { commonEnv, svcEnv } from './e2e-config'

export class OneCXSvcContainer extends OneCXAppContainer {
  private onecxDatabaseContainerName: string
  private onecxKeycloakContainerName: string
  constructor(image: string, network: StartedNetwork) {
    super(image, network)

    this.withOneCXAppType('SVC')
      .withOneCXDatabaseContainerName('postgresdb')
      .withOneCXKeycloakContainerName('keycloak-app')
      .withOneCXEnvironment({
        ...this.getOneCXEnvironment(),
        ...commonEnv,
        ...svcEnv
      })
      .withOneCXHealthCheck({
        test: ['CMD-SHELL', `curl --head -fsS http://localhost:8080/q/health`],
        interval: 10_000,
        timeout: 5_000,
        retries: 3
      })
      .withOneCXExposedPort(8080)
  }

  public withOneCXDatabaseContainerName(container: string) {
    this.onecxDatabaseContainerName = container
    return this
  }

  public getOneCXDatabaseContainerName() {
    return this.onecxDatabaseContainerName
  }

  public withOneCXKeycloakContainerName(container: string) {
    this.onecxKeycloakContainerName = container
    return this
  }

  public getOneCXKeycloakContainerName() {
    return this.onecxKeycloakContainerName
  }

  public async start(): Promise<StartedOneCXSvcContainer> {
    return new StartedOneCXSvcContainer(await super.start(), this.getOneCXAppType(), this.getOneCXAlias())
  }
}

export class StartedOneCXSvcContainer extends StartedOneCXAppContainer {}

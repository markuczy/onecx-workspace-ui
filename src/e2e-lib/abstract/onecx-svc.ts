import { StartedNetwork } from 'testcontainers'
import { OneCXAppContainer, StartedOneCXAppContainer } from './onecx-app'
import { commonEnv, svcEnv } from '../constants/e2e-config'
import { OneCXCoreApplication } from '../model/onecx-application-type'
import { StartedOneCXPostgresContainer } from '../core/onecx-postgres'
import { StartedOneCXKeycloakContainer } from '../core/onecx-keycloak'

export class OneCXSvcContainer extends OneCXAppContainer {
  private onecxDatabaseContainerName: string
  private onecxDatabaseExposedPort: number
  private onecxKeycloakContainerName: string
  private onecxKeycloakExposedPort: number
  constructor(
    image: string,
    aliasAndName: string,
    applicationName: OneCXCoreApplication | string,
    network: StartedNetwork,
    databaseContainer: StartedOneCXPostgresContainer,
    keycloakContainer: StartedOneCXKeycloakContainer
  ) {
    super(image, aliasAndName, 'SVC', applicationName, network)

    this.withOneCXDatabaseContainerName(databaseContainer.getOneCXAlias())
      .withOneCXDatabaseExposedPort(databaseContainer.getOneCXExposedPort() ?? 5432)
      .withOneCXKeycloakContainerName(keycloakContainer.getOneCXAlias())
      .withOneCXKeycloakExposedPort(keycloakContainer.getOneCXExposedPort() ?? 8080)
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

  public withOneCXDatabaseExposedPort(port: number) {
    this.onecxDatabaseExposedPort = port
    return this
  }

  public getOneCXDatabaseExposedPort() {
    return this.onecxDatabaseExposedPort
  }

  public withOneCXKeycloakContainerName(container: string) {
    this.onecxKeycloakContainerName = container
    return this
  }

  public getOneCXKeycloakContainerName() {
    return this.onecxKeycloakContainerName
  }

  public withOneCXKeycloakExposedPort(port: number) {
    this.onecxKeycloakExposedPort = port
    return this
  }

  public getOneCXKeycloakExposedPort() {
    return this.onecxKeycloakExposedPort
  }

  public async start(): Promise<StartedOneCXSvcContainer> {
    return new StartedOneCXSvcContainer(
      await super.start(),
      this.getOneCXAppType(),
      this.getOneCXApplicationName(),
      this.getOneCXAlias()
    )
  }
}

export class StartedOneCXSvcContainer extends StartedOneCXAppContainer {}

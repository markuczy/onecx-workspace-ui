import { StartedNetwork } from 'testcontainers'
import { OneCXAppContainer, StartedOneCXAppContainer } from './onecx-app'
import { commonEnv, svcEnv } from '../constants/e2e-config'
import { OneCXCoreApplication } from '../model/onecx-application-type'
import { StartedOneCXPostgresContainer } from '../core/onecx-postgres'
import { StartedOneCXKeycloakContainer } from '../core/onecx-keycloak'

export class OneCXSvcContainer extends OneCXAppContainer {
  constructor(
    image: string,
    aliasAndName: string,
    applicationName: OneCXCoreApplication | string,
    appId: string,
    network: StartedNetwork,
    private readonly databaseContainer: StartedOneCXPostgresContainer,
    private readonly keycloakContainer: StartedOneCXKeycloakContainer
  ) {
    super(
      image,
      aliasAndName,
      {
        appId: appId,
        applicationName: applicationName,
        appType: 'SVC'
      },
      network
    )

    this.withOneCXEnvironment({
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

  public getOneCXDatabaseContainer() {
    return this.databaseContainer
  }

  public getOneCXKeycloakContainer() {
    return this.keycloakContainer
  }
}

export class StartedOneCXSvcContainer extends StartedOneCXAppContainer {}

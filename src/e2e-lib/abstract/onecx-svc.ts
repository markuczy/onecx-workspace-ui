import { StartedNetwork } from 'testcontainers'
import { OneCXAppContainer, StartedOneCXAppContainer } from './onecx-app'
import { commonEnv, svcEnv } from '../constants/e2e-config'
import { OneCXCoreApplication } from '../model/onecx-application-type'
import { StartedOneCXPostgresContainer } from '../core/onecx-postgres'
import { StartedOneCXKeycloakContainer } from '../core/onecx-keycloak'

export interface OneCXSvcContainerDetails {
  nameAndAlias: string
  applicationName: OneCXCoreApplication | string
  appId: string
}

export interface OneCXSvcContainerServices {
  network: StartedNetwork
  databaseContainer: StartedOneCXPostgresContainer
  keycloakContainer: StartedOneCXKeycloakContainer
}

export class OneCXSvcContainer extends OneCXAppContainer {
  private databaseContainer: StartedOneCXPostgresContainer
  private keycloakContainer: StartedOneCXKeycloakContainer

  constructor(image: string, details: OneCXSvcContainerDetails, services: OneCXSvcContainerServices) {
    super(
      image,
      details.nameAndAlias,
      {
        appId: details.appId,
        applicationName: details.applicationName,
        appType: 'SVC'
      },
      services.network
    )

    this.keycloakContainer = services.keycloakContainer
    this.databaseContainer = services.databaseContainer

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ...commonEnv,
      ...svcEnv,
      KC_REALM: services.keycloakContainer.getOneCXRealm(),
      QUARKUS_OIDC_AUTH_SERVER_URL: `http://${services.keycloakContainer.getOneCXAlias()}:${services.keycloakContainer.getOneCXExposedPort()}/realms/${services.keycloakContainer.getOneCXRealm()}`,
      QUARKUS_OIDC_TOKEN_ISSUER: `http://${services.keycloakContainer.getOneCXAlias()}:${services.keycloakContainer.getOneCXExposedPort()}/realms/${services.keycloakContainer.getOneCXRealm()}`
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

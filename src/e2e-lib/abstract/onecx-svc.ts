import { StartedNetwork } from 'testcontainers'
import { IOneCXAppContainer, OneCXAppContainer, StartedOneCXAppContainer } from './onecx-app'
import { commonEnv, svcEnv } from '../constants/e2e-config'
import { OneCXCoreApplication } from '../model/onecx-application-type'
import { IOneCXKeycloakContainer } from '../core/onecx-keycloak'
import { IOneCXContainer } from './onecx-container'

export interface OneCXSvcContainerDetails {
  name: string
  alias: string
  applicationName: OneCXCoreApplication | string
  appId: string
}

export interface OneCXSvcContainerServices {
  network: StartedNetwork
  databaseContainer: IOneCXContainer
  keycloakContainer: IOneCXKeycloakContainer
}

export interface IOneCXSvcContainer extends IOneCXAppContainer {
  getOneCXKeycloakContainer(): IOneCXKeycloakContainer
}

export class OneCXSvcContainer extends OneCXAppContainer {
  private databaseContainer: IOneCXContainer
  private keycloakContainer: IOneCXKeycloakContainer

  constructor(image: string, details: OneCXSvcContainerDetails, services: OneCXSvcContainerServices) {
    super(
      image,
      details.name,
      details.alias,
      {
        appId: details.appId,
        applicationName: details.applicationName,
        appType: 'SVC'
      },
      services.network
    )

    this.databaseContainer = services.databaseContainer
    this.keycloakContainer = services.keycloakContainer

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

  public getOneCXKeycloakContainer() {
    return this.keycloakContainer
  }

  public getOneCXDatabaseContainer() {
    return this.databaseContainer
  }
}

export class StartedOneCXSvcContainer extends StartedOneCXAppContainer {}

import { StartedNetwork } from 'testcontainers'
import { OneCXAppContainer, StartedOneCXAppContainer } from './onecx-app'
import { bffEnv, commonEnv } from '../constants/e2e-config'
import { OneCXCoreApplication } from '../model/onecx-application-type'
import { StartedOneCXKeycloakContainer } from '../core/onecx-keycloak'

export interface OneCXBffContainerDetails {
  nameAndAlias: string
  applicationName: OneCXCoreApplication | string
  appId: string
}

export interface OneCXBffContainerServices {
  network: StartedNetwork
  keycloakContainer: StartedOneCXKeycloakContainer
}

export class OneCXBffContainer extends OneCXAppContainer {
  constructor(image: string, details: OneCXBffContainerDetails, services: OneCXBffContainerServices) {
    super(
      image,
      details.nameAndAlias,
      {
        appId: details.appId,
        applicationName: details.applicationName,
        appType: 'BFF'
      },
      services.network
    )

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ...commonEnv,
      ...bffEnv,
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
}

export class StartedOneCXBffContainer extends StartedOneCXAppContainer {}

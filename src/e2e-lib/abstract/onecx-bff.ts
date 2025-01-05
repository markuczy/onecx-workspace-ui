import { StartedNetwork } from 'testcontainers'
import { OneCXAppContainer, StartedOneCXAppContainer } from './onecx-app'
import { bffEnv, commonEnv } from '../constants/e2e-config'
import { OneCXCoreApplication } from '../model/onecx-application-type'
import { OneCXKeycloakContainer, StartedOneCXKeycloakContainer } from '../core/onecx-keycloak'

/**
 * Details of the OneCX Bff App describing its relation with an Application
 */
export interface OneCXBffContainerDetails {
  name: string
  alias: string
  applicationName: OneCXCoreApplication | string
  appId: string
}

/**
 * Services required by OneCX Bff App
 */
export interface OneCXBffContainerServices {
  network: StartedNetwork
  keycloakContainer: StartedOneCXKeycloakContainer | OneCXKeycloakContainer
}

/**
 * Defined OneCX Bff App container
 */
export class OneCXBffContainer extends OneCXAppContainer {
  constructor(image: string, details: OneCXBffContainerDetails, services: OneCXBffContainerServices) {
    super(
      image,
      details.name,
      details.alias,
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

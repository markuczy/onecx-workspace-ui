import { StartedNetwork } from 'testcontainers'
import { OneCXAppContainer, StartedOneCXAppContainer } from './onecx-app'
import { OneCXCoreApplication } from '../model/onecx-application-type'
import { StartedOneCXKeycloakContainer } from '../core/onecx-keycloak'
import { commonEnv } from '../constants/e2e-config'

export interface OneCXUiContainerDetails {
  nameAndAlias: string
  applicationName: OneCXCoreApplication | string
  appId: string
}

export interface OneCXUiContainerServices {
  network: StartedNetwork
  keycloakContainer: StartedOneCXKeycloakContainer
}

export class OneCXUiContainer extends OneCXAppContainer {
  constructor(image: string, details: OneCXUiContainerDetails, services: OneCXUiContainerServices) {
    super(
      image,
      details.nameAndAlias,
      {
        appId: details.appId,
        applicationName: details.applicationName,
        appType: 'UI'
      },
      services.network
    )

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ...commonEnv,
      KC_REALM: services.keycloakContainer.getOneCXRealm(),
      QUARKUS_OIDC_AUTH_SERVER_URL: `http://${services.keycloakContainer.getOneCXAlias()}:${services.keycloakContainer.getOneCXExposedPort()}/realms/${services.keycloakContainer.getOneCXRealm()}`,
      QUARKUS_OIDC_TOKEN_ISSUER: `http://${services.keycloakContainer.getOneCXAlias()}:${services.keycloakContainer.getOneCXExposedPort()}/realms/${services.keycloakContainer.getOneCXRealm()}`
    }).withOneCXExposedPort(8080)
  }
}

export class StartedOneCXUiContainer extends StartedOneCXAppContainer {}

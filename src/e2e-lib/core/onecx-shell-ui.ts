import { StartedNetwork } from 'testcontainers'
import { OneCXUiContainer, StartedOneCXUiContainer } from '../abstract/onecx-ui'
import { commonEnv } from '../constants/e2e-config'
import { StartedOneCXKeycloakContainer } from './onecx-keycloak'

export class OneCXShellUiContainer extends OneCXUiContainer {
  constructor(image: string, network: StartedNetwork, keycloakContainer: StartedOneCXKeycloakContainer) {
    super(image, 'onecx-shell-ui', 'shell', 'shell-ui', network)

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ...commonEnv,
      ONECX_PERMISSIONS_ENABLED: 'false',
      ONECX_PERMISSIONS_CACHE_ENABLED: 'false',
      ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-shell',
      APP_BASE_HREF: '/onecx-shell/',
      KEYCLOAK_URL: `http://${keycloakContainer.getOneCXAlias()}:${keycloakContainer.getOneCXExposedPort()}`,
      ONECX_VAR_REMAP: 'KEYCLOAK_REALM=KC_REALM;KEYCLOAK_CLIENT_ID=CLIENT_USER_ID',
      CLIENT_USER_ID: 'onecx-shell-ui-client'
    })
  }
}

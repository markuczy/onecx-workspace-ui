import { StartedNetwork } from 'testcontainers'
import { OneCXUiContainer, StartedOneCXUiContainer } from './onecx-ui'
import { commonEnv } from './e2e-config'

// TODO: keycloak-app static name and port
// ONECX_PERMISSIONS_PRODUCT_NAME based on the database
export class OneCXShellUiContainer extends OneCXUiContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, network)

    this.withOneCXNameAndAlias('onecx-shell-ui').withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ...commonEnv,
      ONECX_PERMISSIONS_ENABLED: 'false',
      ONECX_PERMISSIONS_CACHE_ENABLED: 'false',
      ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-shell',
      APP_BASE_HREF: '/onecx-shell/',
      KEYCLOAK_URL: `http://keycloak-app:8080`,
      ONECX_VAR_REMAP: 'KEYCLOAK_REALM=KC_REALM;KEYCLOAK_CLIENT_ID=CLIENT_USER_ID',
      CLIENT_USER_ID: 'onecx-shell-ui-client'
    })
  }

  async start(): Promise<StartedOneCXShellUiContainer> {
    return new StartedOneCXShellUiContainer(await super.start(), this.getOneCXAppType(), this.getOneCXAlias())
  }
}

export class StartedOneCXShellUiContainer extends StartedOneCXUiContainer {}

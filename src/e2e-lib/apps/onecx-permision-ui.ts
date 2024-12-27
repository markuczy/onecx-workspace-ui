import { StartedNetwork } from 'testcontainers'
import { OneCXUiContainer, StartedOneCXUiContainer } from '../abstract/onecx-ui'
import { commonEnv } from '../constants/e2e-config'

export class OneCXPermissionUiContainer extends OneCXUiContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, 'onecx-permission-ui', 'permission', network)

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ...commonEnv,
      APP_BASE_HREF: '/mfe/permission/',
      APP_ID: 'onecx-permission-ui',
      PRODUCT_NAME: 'onecx-permission'
    })
  }

  async start(): Promise<StartedOneCXPermissionUiContainer> {
    return new StartedOneCXPermissionUiContainer(
      await super.start(),
      this.getOneCXAppType(),
      this.getOneCXApplicationName(),
      this.getOneCXAlias()
    )
  }
}

export class StartedOneCXPermissionUiContainer extends StartedOneCXUiContainer {}

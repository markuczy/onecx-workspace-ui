import { StartedNetwork } from 'testcontainers'
import { OneCXUiContainer, StartedOneCXUiContainer } from '../abstract/onecx-ui'
import { commonEnv } from '../constants/e2e-config'

export class OneCXThemeUiContainer extends OneCXUiContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, 'onecx-theme-ui', 'theme', network)

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ...commonEnv,
      APP_BASE_HREF: '/mfe/theme/',
      APP_ID: 'onecx-theme-ui',
      PRODUCT_NAME: 'onecx-theme'
    })
  }

  async start(): Promise<StartedOneCXThemeUiContainer> {
    return new StartedOneCXThemeUiContainer(
      await super.start(),
      this.getOneCXAppType(),
      this.getOneCXApplicationName(),
      this.getOneCXAlias()
    )
  }
}

export class StartedOneCXThemeUiContainer extends StartedOneCXUiContainer {}

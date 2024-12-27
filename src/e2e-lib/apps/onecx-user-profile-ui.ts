import { StartedNetwork } from 'testcontainers'
import { OneCXUiContainer, StartedOneCXUiContainer } from '../abstract/onecx-ui'
import { commonEnv } from '../constants/e2e-config'

export class OneCXUserProfileUiContainer extends OneCXUiContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, 'onecx-user-profile-ui', 'user-profile', network)

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ...commonEnv,
      APP_BASE_HREF: '/mfe/user-profile/',
      APP_ID: 'onecx-user-profile-ui',
      PRODUCT_NAME: 'onecx-user-profile'
    })
  }

  async start(): Promise<StartedOneCXUserProfileUiContainer> {
    return new StartedOneCXUserProfileUiContainer(
      await super.start(),
      this.getOneCXAppType(),
      this.getOneCXApplicationName(),
      this.getOneCXAlias()
    )
  }
}

export class StartedOneCXUserProfileUiContainer extends StartedOneCXUiContainer {}

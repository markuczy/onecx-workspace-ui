import { StartedNetwork } from 'testcontainers'
import { OneCXUiContainer, StartedOneCXUiContainer } from './onecx-ui'
import { commonEnv } from './e2e-config'

// ONECX_PERMISSIONS_PRODUCT_NAME based on the database
// APP_BASE_HREF based on database
// APP_ID based on database
// PRODUCT_NAME based on database
export class OneCXUserProfileUiContainer extends OneCXUiContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, network)

    this.withOneCXNameAndAlias('onecx-user-profile-ui').withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ...commonEnv,
      APP_BASE_HREF: '/mfe/user-profile/',
      APP_ID: 'onecx-user-profile-ui',
      PRODUCT_NAME: 'onecx-user-profile'
    })
  }

  async start(): Promise<StartedOneCXUserProfileUiContainer> {
    return new StartedOneCXUserProfileUiContainer(await super.start(), this.getOneCXAppType(), this.getOneCXAlias())
  }
}

export class StartedOneCXUserProfileUiContainer extends StartedOneCXUiContainer {}

import { StartedNetwork } from 'testcontainers'
import { OneCXBffContainer, StartedOneCXBffContainer } from '../abstract/onecx-bff'

export class OneCXUserProfileBffContainer extends OneCXBffContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, 'onecx-user-profile-bff', 'user-profile', network)

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-user-profile'
    })
  }

  async start(): Promise<StartedOneCXUserProfileBffContainer> {
    return new StartedOneCXUserProfileBffContainer(
      await super.start(),
      this.getOneCXAppType(),
      this.getOneCXApplicationName(),
      this.getOneCXAlias()
    )
  }
}

export class StartedOneCXUserProfileBffContainer extends StartedOneCXBffContainer {}

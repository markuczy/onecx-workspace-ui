import { StartedNetwork } from 'testcontainers'
import { OneCXBffContainer, StartedOneCXBffContainer } from './onecx-bff'

export class OneCXUserProfileBffContainer extends OneCXBffContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, network)

    this.withOneCXNameAndAlias('onecx-user-profile-bff').withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-user-profile'
    })
  }

  async start(): Promise<StartedOneCXUserProfileBffContainer> {
    return new StartedOneCXUserProfileBffContainer(await super.start(), this.getOneCXAppType(), this.getOneCXAlias())
  }
}

export class StartedOneCXUserProfileBffContainer extends StartedOneCXBffContainer {}

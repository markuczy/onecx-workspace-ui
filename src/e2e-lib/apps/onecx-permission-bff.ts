import { StartedNetwork } from 'testcontainers'
import { OneCXBffContainer, StartedOneCXBffContainer } from '../abstract/onecx-bff'

export class OneCXPermissionBffContainer extends OneCXBffContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, 'onecx-permission-bff', 'permission', network)

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-permission'
    })
  }

  async start(): Promise<StartedOneCXPermissionBffContainer> {
    return new StartedOneCXPermissionBffContainer(
      await super.start(),
      this.getOneCXAppType(),
      this.getOneCXApplicationName(),
      this.getOneCXAlias()
    )
  }
}

export class StartedOneCXPermissionBffContainer extends StartedOneCXBffContainer {}

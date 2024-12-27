import { StartedNetwork } from 'testcontainers'
import { OneCXBffContainer, StartedOneCXBffContainer } from './onecx-bff'

export class OneCXWorkspaceBffContainer extends OneCXBffContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, network)

    this.withOneCXNameAndAlias('onecx-workspace-bff').withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-workspace'
    })
  }

  async start(): Promise<StartedOneCXWorkspaceBffContainer> {
    return new StartedOneCXWorkspaceBffContainer(await super.start(), this.getOneCXAppType(), this.getOneCXAlias())
  }
}

export class StartedOneCXWorkspaceBffContainer extends StartedOneCXBffContainer {}

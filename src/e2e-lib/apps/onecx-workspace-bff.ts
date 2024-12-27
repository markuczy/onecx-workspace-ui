import { StartedNetwork } from 'testcontainers'
import { OneCXBffContainer, StartedOneCXBffContainer } from '../abstract/onecx-bff'

export class OneCXWorkspaceBffContainer extends OneCXBffContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, 'onecx-workspace-bff', 'workspace', network)

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-workspace'
    })
  }

  async start(): Promise<StartedOneCXWorkspaceBffContainer> {
    return new StartedOneCXWorkspaceBffContainer(
      await super.start(),
      this.getOneCXAppType(),
      this.getOneCXApplicationName(),
      this.getOneCXAlias()
    )
  }
}

export class StartedOneCXWorkspaceBffContainer extends StartedOneCXBffContainer {}

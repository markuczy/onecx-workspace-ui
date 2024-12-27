import { StartedNetwork } from 'testcontainers'
import { OneCXBffContainer, StartedOneCXBffContainer } from '../abstract/onecx-bff'

export class OneCXIamBffContainer extends OneCXBffContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, 'onecx-iam-bff', 'iam', network)

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-iam'
    })
  }

  async start(): Promise<StartedOneCXIamBffContainer> {
    return new StartedOneCXIamBffContainer(
      await super.start(),
      this.getOneCXAppType(),
      this.getOneCXApplicationName(),
      this.getOneCXAlias()
    )
  }
}

export class StartedOneCXIamBffContainer extends StartedOneCXBffContainer {}

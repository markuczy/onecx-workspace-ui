import { StartedNetwork } from 'testcontainers'
import { OneCXBffContainer, StartedOneCXBffContainer } from './onecx-bff'

export class OneCXIamBffContainer extends OneCXBffContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, network)

    this.withOneCXNameAndAlias('onecx-iam-bff').withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-iam'
    })
  }

  async start(): Promise<StartedOneCXIamBffContainer> {
    return new StartedOneCXIamBffContainer(await super.start(), this.getOneCXAppType(), this.getOneCXAlias())
  }
}

export class StartedOneCXIamBffContainer extends StartedOneCXBffContainer {}

import { StartedNetwork } from 'testcontainers'
import { OneCXBffContainer, StartedOneCXBffContainer } from './onecx-bff'

export class OneCXProductStoreBffContainer extends OneCXBffContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, network)

    this.withOneCXNameAndAlias('onecx-product-store-bff').withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-product-store'
    })
  }

  async start(): Promise<StartedOneCXABffContainer> {
    return new StartedOneCXABffContainer(await super.start(), this.getOneCXAppType(), this.getOneCXAlias())
  }
}

export class StartedOneCXABffContainer extends StartedOneCXBffContainer {}

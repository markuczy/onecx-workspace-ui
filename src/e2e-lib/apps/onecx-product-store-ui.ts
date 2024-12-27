import { StartedNetwork } from 'testcontainers'
import { OneCXUiContainer, StartedOneCXUiContainer } from '../abstract/onecx-ui'
import { commonEnv } from '../constants/e2e-config'

export class OneCXProductStoreUiContainer extends OneCXUiContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, 'onecx-product-store-ui', 'product-store', network)

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ...commonEnv,
      APP_BASE_HREF: '/mfe/product-store/',
      APP_ID: 'onecx-product-store-ui',
      PRODUCT_NAME: 'onecx-product-store'
    })
  }

  async start(): Promise<StartedOneCXProductStoreUiContainer> {
    return new StartedOneCXProductStoreUiContainer(
      await super.start(),
      this.getOneCXAppType(),
      this.getOneCXApplicationName(),
      this.getOneCXAlias()
    )
  }
}

export class StartedOneCXProductStoreUiContainer extends StartedOneCXUiContainer {}

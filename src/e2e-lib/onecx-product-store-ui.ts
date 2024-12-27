import { StartedNetwork } from 'testcontainers'
import { OneCXUiContainer, StartedOneCXUiContainer } from './onecx-ui'
import { commonEnv } from './e2e-config'

// ONECX_PERMISSIONS_PRODUCT_NAME based on the database
// APP_BASE_HREF based on database
// APP_ID based on database
// PRODUCT_NAME based on database
export class OneCXProductStoreUiContainer extends OneCXUiContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, network)

    this.withOneCXNameAndAlias('onecx-product-store-ui').withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ...commonEnv,
      APP_BASE_HREF: '/mfe/product-store/',
      APP_ID: 'onecx-product-store-ui',
      PRODUCT_NAME: 'onecx-product-store'
    })
  }

  async start(): Promise<StartedOneCXProductStoreUiContainer> {
    return new StartedOneCXProductStoreUiContainer(await super.start(), this.getOneCXAppType(), this.getOneCXAlias())
  }
}

export class StartedOneCXProductStoreUiContainer extends StartedOneCXUiContainer {}

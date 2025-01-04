import { OneCXUiContainer, OneCXUiContainerServices } from '../abstract/onecx-ui'

export class OneCXProductStoreUiContainer extends OneCXUiContainer {
  constructor(image: string, services: OneCXUiContainerServices) {
    super(
      image,
      { nameAndAlias: 'onecx-product-store-ui', applicationName: 'product-store', appId: 'product-store-ui' },
      services
    )

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      APP_BASE_HREF: '/mfe/product-store/',
      APP_ID: 'onecx-product-store-ui',
      PRODUCT_NAME: 'onecx-product-store'
    })
  }
}

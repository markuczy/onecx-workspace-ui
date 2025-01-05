import { OneCXUiContainer, OneCXUiContainerServices } from '../abstract/onecx-ui'
import { OneCXCoreApplication, OneCXCoreApplications } from '../model/onecx-application-type'

export class OneCXProductStoreUiContainer extends OneCXUiContainer {
  constructor(image: string, services: OneCXUiContainerServices) {
    super(
      image,
      {
        name: 'onecx-product-store-ui',
        alias: 'onecx-product-store-ui',
        applicationName: OneCXCoreApplications.PRODUCT_STORE satisfies OneCXCoreApplication,
        appId: 'product-store-ui'
      },
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

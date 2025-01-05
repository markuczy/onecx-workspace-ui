import { OneCXBffContainer, OneCXBffContainerServices } from '../abstract/onecx-bff'
import { OneCXCoreApplication, OneCXCoreApplications } from '../model/onecx-application-type'

export class OneCXProductStoreBffContainer extends OneCXBffContainer {
  constructor(image: string, services: OneCXBffContainerServices) {
    super(
      image,
      {
        name: 'onecx-product-store-bff',
        alias: 'onecx-product-store-bff',
        applicationName: OneCXCoreApplications.PRODUCT_STORE satisfies OneCXCoreApplication,
        appId: 'product-store-bff'
      },
      services
    )

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-product-store'
    })
  }
}

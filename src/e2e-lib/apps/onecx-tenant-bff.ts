import { OneCXBffContainer, OneCXBffContainerServices } from '../abstract/onecx-bff'
import { OneCXCoreApplication, OneCXCoreApplications } from '../model/onecx-application-type'

export class OneCXTenantBffContainer extends OneCXBffContainer {
  constructor(image: string, services: OneCXBffContainerServices) {
    super(
      image,
      {
        name: 'onecx-tenant-bff',
        alias: 'onecx-tenant-bff',
        applicationName: OneCXCoreApplications.TENANT satisfies OneCXCoreApplication,
        appId: 'tenant-bff'
      },
      services
    )

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-tenant'
    })
  }
}

import { OneCXUiContainer, OneCXUiContainerServices } from '../abstract/onecx-ui'
import { OneCXCoreApplication, OneCXCoreApplications } from '../model/onecx-application-type'

export class OneCXTenantUiContainer extends OneCXUiContainer {
  constructor(image: string, services: OneCXUiContainerServices) {
    super(
      image,
      {
        name: 'onecx-tenant-ui',
        alias: 'onecx-tenant-ui',
        applicationName: OneCXCoreApplications.TENANT satisfies OneCXCoreApplication,
        appId: 'tenant-ui'
      },
      services
    )

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      APP_BASE_HREF: '/mfe/tenant/',
      APP_ID: 'onecx-tenant-ui',
      PRODUCT_NAME: 'onecx-tenant'
    })
  }
}

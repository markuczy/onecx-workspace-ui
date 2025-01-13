import { OneCXUiContainer, OneCXUiContainerServices } from '../abstract/onecx-ui'
import { OneCXCoreApplication, OneCXCoreApplications } from '../model/onecx-application-type'

export class OneCXPermissionUiContainer extends OneCXUiContainer {
  constructor(image: string, services: OneCXUiContainerServices) {
    super(
      image,
      {
        name: 'onecx-permission-ui',
        alias: 'onecx-permission-ui',
        applicationName: OneCXCoreApplications.PERMISSION satisfies OneCXCoreApplication,
        appId: 'permission-ui'
      },
      services
    )

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      APP_BASE_HREF: '/mfe/permission/',
      APP_ID: 'onecx-permission-ui',
      PRODUCT_NAME: 'onecx-permission'
    })
  }
}

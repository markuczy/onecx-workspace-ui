import { OneCXBffContainer, OneCXBffContainerServices } from '../abstract/onecx-bff'
import { OneCXCoreApplication, OneCXCoreApplications } from '../model/onecx-application-type'

export class OneCXPermissionBffContainer extends OneCXBffContainer {
  constructor(image: string, services: OneCXBffContainerServices) {
    super(
      image,
      {
        name: 'onecx-permission-bff',
        alias: 'onecx-permission-bff',
        applicationName: OneCXCoreApplications.PERMISSION satisfies OneCXCoreApplication,
        appId: 'permission-bff'
      },
      services
    )

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-permission'
    })
  }
}

import { OneCXBffContainer, OneCXBffContainerServices } from '../abstract/onecx-bff'
import { OneCXCoreApplication, OneCXCoreApplications } from '../model/onecx-application-type'

export class OneCXWorkspaceBffContainer extends OneCXBffContainer {
  constructor(image: string, services: OneCXBffContainerServices) {
    super(
      image,
      {
        name: 'onecx-workspace-bff',
        alias: 'onecx-workspace-bff',
        applicationName: OneCXCoreApplications.WORKSPACE satisfies OneCXCoreApplication,
        appId: 'workspace-bff'
      },
      services
    )

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-workspace'
    })
  }
}

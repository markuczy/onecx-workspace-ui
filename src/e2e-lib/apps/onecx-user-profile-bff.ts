import { OneCXBffContainer, OneCXBffContainerServices } from '../abstract/onecx-bff'
import { OneCXCoreApplication, OneCXCoreApplications } from '../model/onecx-application-type'

export class OneCXUserProfileBffContainer extends OneCXBffContainer {
  constructor(image: string, services: OneCXBffContainerServices) {
    super(
      image,
      {
        name: 'onecx-user-profile-bff',
        alias: 'onecx-user-profile-bff',
        applicationName: OneCXCoreApplications.USER_PROFILE satisfies OneCXCoreApplication,
        appId: 'user-profile-bff'
      },
      services
    )

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-user-profile'
    })
  }
}

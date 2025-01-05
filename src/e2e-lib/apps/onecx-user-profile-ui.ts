import { OneCXUiContainer, OneCXUiContainerServices } from '../abstract/onecx-ui'
import { OneCXCoreApplication, OneCXCoreApplications } from '../model/onecx-application-type'

export class OneCXUserProfileUiContainer extends OneCXUiContainer {
  constructor(image: string, services: OneCXUiContainerServices) {
    super(
      image,
      {
        name: 'onecx-user-profile-ui',
        alias: 'onecx-user-profile-ui',
        applicationName: OneCXCoreApplications.USER_PROFILE satisfies OneCXCoreApplication,
        appId: 'user-profile-ui'
      },
      services
    )

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      APP_BASE_HREF: '/mfe/user-profile/',
      APP_ID: 'onecx-user-profile-ui',
      PRODUCT_NAME: 'onecx-user-profile'
    })
  }
}

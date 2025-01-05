import { OneCXUiContainer, OneCXUiContainerServices } from '../abstract/onecx-ui'
import { OneCXCoreApplication, OneCXCoreApplications } from '../model/onecx-application-type'

export class OneCXThemeUiContainer extends OneCXUiContainer {
  constructor(image: string, services: OneCXUiContainerServices) {
    super(
      image,
      {
        name: 'onecx-theme-ui',
        alias: 'onecx-theme-ui',
        applicationName: OneCXCoreApplications.THEME satisfies OneCXCoreApplication,
        appId: 'theme-ui'
      },
      services
    )

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      APP_BASE_HREF: '/mfe/theme/',
      APP_ID: 'onecx-theme-ui',
      PRODUCT_NAME: 'onecx-theme'
    })
  }
}

import { OneCXUiContainer, OneCXUiContainerServices } from '../abstract/onecx-ui'

export class OneCXThemeUiContainer extends OneCXUiContainer {
  constructor(image: string, services: OneCXUiContainerServices) {
    super(image, { nameAndAlias: 'onecx-theme-ui', applicationName: 'theme', appId: 'theme-ui' }, services)

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      APP_BASE_HREF: '/mfe/theme/',
      APP_ID: 'onecx-theme-ui',
      PRODUCT_NAME: 'onecx-theme'
    })
  }
}

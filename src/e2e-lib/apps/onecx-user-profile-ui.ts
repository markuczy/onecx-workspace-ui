import { OneCXUiContainer, OneCXUiContainerServices } from '../abstract/onecx-ui'

export class OneCXUserProfileUiContainer extends OneCXUiContainer {
  constructor(image: string, services: OneCXUiContainerServices) {
    super(
      image,
      { nameAndAlias: 'onecx-user-profile-ui', applicationName: 'user-profile', appId: 'user-profile-ui' },
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

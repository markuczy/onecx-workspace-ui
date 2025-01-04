import { OneCXUiContainer, OneCXUiContainerServices } from '../abstract/onecx-ui'

export class OneCXIamUiContainer extends OneCXUiContainer {
  constructor(image: string, services: OneCXUiContainerServices) {
    super(image, { nameAndAlias: 'onecx-iam-ui', applicationName: 'iam', appId: 'iam-ui' }, services)

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      APP_BASE_HREF: '/mfe/iam/',
      APP_ID: 'onecx-iam-ui',
      PRODUCT_NAME: 'onecx-iam'
    })
  }
}

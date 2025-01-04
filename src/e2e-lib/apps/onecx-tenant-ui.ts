import { OneCXUiContainer, OneCXUiContainerServices } from '../abstract/onecx-ui'

export class OneCXTenantUiContainer extends OneCXUiContainer {
  constructor(image: string, services: OneCXUiContainerServices) {
    super(image, { nameAndAlias: 'onecx-tenant-ui', applicationName: 'tenant', appId: 'tenant-ui' }, services)

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      APP_BASE_HREF: '/mfe/tenant/',
      APP_ID: 'onecx-tenant-ui',
      PRODUCT_NAME: 'onecx-tenant'
    })
  }
}

import { OneCXBffContainer, OneCXBffContainerServices } from '../abstract/onecx-bff'

export class OneCXTenantBffContainer extends OneCXBffContainer {
  constructor(image: string, services: OneCXBffContainerServices) {
    super(image, { nameAndAlias: 'onecx-tenant-bff', applicationName: 'tenant', appId: 'tenant-bff' }, services)

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-tenant'
    })
  }
}

import { OneCXBffContainer, OneCXBffContainerServices } from '../abstract/onecx-bff'

export class OneCXPermissionBffContainer extends OneCXBffContainer {
  constructor(image: string, services: OneCXBffContainerServices) {
    super(
      image,
      { nameAndAlias: 'onecx-permission-bff', applicationName: 'permission', appId: 'permission-bff' },
      services
    )

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-permission'
    })
  }
}

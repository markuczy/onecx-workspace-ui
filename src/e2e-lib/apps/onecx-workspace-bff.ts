import { OneCXBffContainer, OneCXBffContainerServices } from '../abstract/onecx-bff'

export class OneCXWorkspaceBffContainer extends OneCXBffContainer {
  constructor(image: string, services: OneCXBffContainerServices) {
    super(
      image,
      { nameAndAlias: 'onecx-workspace-bff', applicationName: 'workspace', appId: 'workspace-bff' },
      services
    )

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-workspace'
    })
  }
}

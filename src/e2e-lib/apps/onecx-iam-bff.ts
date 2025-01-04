import { OneCXBffContainer, OneCXBffContainerServices } from '../abstract/onecx-bff'

export class OneCXIamBffContainer extends OneCXBffContainer {
  constructor(image: string, services: OneCXBffContainerServices) {
    super(image, { nameAndAlias: 'onecx-iam-bff', applicationName: 'iam', appId: 'iam-bff' }, services)

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-iam'
    })
  }
}

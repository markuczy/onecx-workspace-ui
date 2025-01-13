import { OneCXBffContainer, OneCXBffContainerServices } from '../abstract/onecx-bff'
import { OneCXCoreApplication, OneCXCoreApplications } from '../model/onecx-application-type'

export class OneCXIamBffContainer extends OneCXBffContainer {
  constructor(image: string, services: OneCXBffContainerServices) {
    super(
      image,
      {
        name: 'onecx-iam-bff',
        alias: 'onecx-iam-bff',
        applicationName: OneCXCoreApplications.IAM satisfies OneCXCoreApplication,
        appId: 'iam-bff'
      },
      services
    )

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-iam'
    })
  }
}

import { OneCXUiContainer, OneCXUiContainerServices } from '../abstract/onecx-ui'
import { OneCXCoreApplication, OneCXCoreApplications } from '../model/onecx-application-type'

export class OneCXIamUiContainer extends OneCXUiContainer {
  constructor(image: string, services: OneCXUiContainerServices) {
    super(
      image,
      {
        name: 'onecx-iam-ui',
        alias: 'onecx-iam-ui',
        applicationName: OneCXCoreApplications.IAM satisfies OneCXCoreApplication,
        appId: 'iam-ui'
      },
      services
    )

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      APP_BASE_HREF: '/mfe/iam/',
      APP_ID: 'onecx-iam-ui',
      PRODUCT_NAME: 'onecx-iam'
    })
  }
}

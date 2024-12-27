import { StartedNetwork } from 'testcontainers'
import { OneCXUiContainer, StartedOneCXUiContainer } from './onecx-ui'
import { commonEnv } from './e2e-config'

// ONECX_PERMISSIONS_PRODUCT_NAME based on the database
// APP_BASE_HREF based on database
// APP_ID based on database
// PRODUCT_NAME based on database
export class OneCXIamUiContainer extends OneCXUiContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, network)

    this.withOneCXNameAndAlias('onecx-iam-ui').withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ...commonEnv,
      APP_BASE_HREF: '/mfe/iam/',
      APP_ID: 'onecx-iam-ui',
      PRODUCT_NAME: 'onecx-iam'
    })
  }

  async start(): Promise<StartedOneCXIamUiContainer> {
    return new StartedOneCXIamUiContainer(await super.start(), this.getOneCXAppType(), this.getOneCXAlias())
  }
}

export class StartedOneCXIamUiContainer extends StartedOneCXUiContainer {}

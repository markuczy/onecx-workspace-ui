import { StartedNetwork } from 'testcontainers'
import { OneCXUiContainer, StartedOneCXUiContainer } from '../abstract/onecx-ui'
import { commonEnv } from '../constants/e2e-config'

export class OneCXIamUiContainer extends OneCXUiContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, 'onecx-iam-ui', 'iam', network)

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ...commonEnv,
      APP_BASE_HREF: '/mfe/iam/',
      APP_ID: 'onecx-iam-ui',
      PRODUCT_NAME: 'onecx-iam'
    })
  }

  async start(): Promise<StartedOneCXIamUiContainer> {
    return new StartedOneCXIamUiContainer(
      await super.start(),
      this.getOneCXAppType(),
      this.getOneCXApplicationName(),
      this.getOneCXAlias()
    )
  }
}

export class StartedOneCXIamUiContainer extends StartedOneCXUiContainer {}

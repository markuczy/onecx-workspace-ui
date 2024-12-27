import { StartedNetwork } from 'testcontainers'
import { OneCXUiContainer, StartedOneCXUiContainer } from '../abstract/onecx-ui'
import { commonEnv } from '../constants/e2e-config'

export class OneCXWorkspaceUiContainer extends OneCXUiContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, 'onecx-workspace-ui', 'workspace', network)

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ...commonEnv,
      APP_BASE_HREF: '/mfe/workspace/',
      APP_ID: 'onecx-workspace-ui',
      PRODUCT_NAME: 'onecx-workspace'
    })
  }

  async start(): Promise<StartedOneCXWorkspaceUiContainer> {
    return new StartedOneCXWorkspaceUiContainer(
      await super.start(),
      this.getOneCXAppType(),
      this.getOneCXApplicationName(),
      this.getOneCXAlias()
    )
  }
}

export class StartedOneCXWorkspaceUiContainer extends StartedOneCXUiContainer {}

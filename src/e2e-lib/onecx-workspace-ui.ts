import { StartedNetwork } from 'testcontainers'
import { OneCXUiContainer, StartedOneCXUiContainer } from './onecx-ui'
import { commonEnv } from './e2e-config'

// ONECX_PERMISSIONS_PRODUCT_NAME based on the database
// APP_BASE_HREF based on database
// APP_ID based on database
// PRODUCT_NAME based on database
export class OneCXWorkspaceUiContainer extends OneCXUiContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, network)

    this.withOneCXNameAndAlias('onecx-workspace-ui').withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ...commonEnv,
      APP_BASE_HREF: '/mfe/workspace/',
      APP_ID: 'onecx-workspace-ui',
      PRODUCT_NAME: 'onecx-workspace'
    })
  }

  async start(): Promise<StartedOneCXWorkspaceUiContainer> {
    return new StartedOneCXWorkspaceUiContainer(await super.start(), this.getOneCXAppType(), this.getOneCXAlias())
  }
}

export class StartedOneCXWorkspaceUiContainer extends StartedOneCXUiContainer {}

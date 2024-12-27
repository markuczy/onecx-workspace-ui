import { StartedNetwork } from 'testcontainers'
import { OneCXUiContainer, StartedOneCXUiContainer } from './onecx-ui'
import { commonEnv } from './e2e-config'

// ONECX_PERMISSIONS_PRODUCT_NAME based on the database
// APP_BASE_HREF based on database
// APP_ID based on database
// PRODUCT_NAME based on database
export class OneCXTenantUiContainer extends OneCXUiContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, network)

    this.withOneCXNameAndAlias('onecx-tenant-ui').withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ...commonEnv,
      APP_BASE_HREF: '/mfe/tenant/',
      APP_ID: 'onecx-tenant-ui',
      PRODUCT_NAME: 'onecx-tenant'
    })
  }

  async start(): Promise<StartedOneCXTenantUiContainer> {
    return new StartedOneCXTenantUiContainer(await super.start(), this.getOneCXAppType(), this.getOneCXAlias())
  }
}

export class StartedOneCXTenantUiContainer extends StartedOneCXUiContainer {}

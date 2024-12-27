import { StartedNetwork } from 'testcontainers'
import { OneCXUiContainer, StartedOneCXUiContainer } from '../abstract/onecx-ui'
import { commonEnv } from '../constants/e2e-config'

export class OneCXTenantUiContainer extends OneCXUiContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, 'onecx-tenant-ui', 'tenant', network)

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ...commonEnv,
      APP_BASE_HREF: '/mfe/tenant/',
      APP_ID: 'onecx-tenant-ui',
      PRODUCT_NAME: 'onecx-tenant'
    })
  }

  async start(): Promise<StartedOneCXTenantUiContainer> {
    return new StartedOneCXTenantUiContainer(
      await super.start(),
      this.getOneCXAppType(),
      this.getOneCXApplicationName(),
      this.getOneCXAlias()
    )
  }
}

export class StartedOneCXTenantUiContainer extends StartedOneCXUiContainer {}

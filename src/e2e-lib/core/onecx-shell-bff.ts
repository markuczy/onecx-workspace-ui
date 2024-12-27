import { StartedNetwork } from 'testcontainers'
import { OneCXBffContainer, StartedOneCXBffContainer } from '../abstract/onecx-bff'

export class OneCXShellBffContainer extends OneCXBffContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, 'onecx-shell-bff', 'shell', network)

    this.withOneCXHealthCheck({
      test: ['CMD-SHELL', `curl --head -fsS http://localhost:8080/q/health`],
      interval: 10_000,
      timeout: 5_000,
      retries: 3,
      startPeriod: 10_000
    }).withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-shell'
    })
  }

  async start(): Promise<StartedOneCXShellBffContainer> {
    return new StartedOneCXShellBffContainer(
      await super.start(),
      this.getOneCXAppType(),
      this.getOneCXApplicationName(),
      this.getOneCXAlias()
    )
  }
}

export class StartedOneCXShellBffContainer extends StartedOneCXBffContainer {}

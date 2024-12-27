import { StartedNetwork } from 'testcontainers'
import { OneCXAppContainer, StartedOneCXAppContainer } from './onecx-app'
import { bffEnv, commonEnv } from './e2e-config'

export class OneCXBffContainer extends OneCXAppContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, network)

    this.withOneCXAppType('BFF')
      .withOneCXEnvironment({
        ...this.getOneCXEnvironment(),
        ...commonEnv,
        ...bffEnv
      })
      .withOneCXHealthCheck({
        test: ['CMD-SHELL', `curl --head -fsS http://localhost:8080/q/health`],
        interval: 10_000,
        timeout: 5_000,
        retries: 3
      })
      .withOneCXExposedPort(8080)
  }

  public async start(): Promise<StartedOneCXBffContainer> {
    return new StartedOneCXBffContainer(await super.start(), this.getOneCXAppType(), this.getOneCXAlias())
  }
}

export class StartedOneCXBffContainer extends StartedOneCXAppContainer {}

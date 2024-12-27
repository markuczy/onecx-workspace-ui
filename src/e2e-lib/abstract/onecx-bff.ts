import { StartedNetwork } from 'testcontainers'
import { OneCXAppContainer, StartedOneCXAppContainer } from './onecx-app'
import { bffEnv, commonEnv } from '../constants/e2e-config'
import { OneCXCoreApplication } from '../model/onecx-application-type'

export class OneCXBffContainer extends OneCXAppContainer {
  constructor(
    image: string,
    aliasAndName: string,
    applicationName: OneCXCoreApplication | string,
    network: StartedNetwork
  ) {
    super(image, aliasAndName, 'BFF', applicationName, network)

    this.withOneCXEnvironment({
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
    return new StartedOneCXBffContainer(
      await super.start(),
      this.getOneCXAppType(),
      this.getOneCXApplicationName(),
      this.getOneCXAlias()
    )
  }
}

export class StartedOneCXBffContainer extends StartedOneCXAppContainer {}

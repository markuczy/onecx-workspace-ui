import { StartedNetwork } from 'testcontainers'
import { OneCXAppContainer, StartedOneCXAppContainer } from './onecx-app'
import { OneCXCoreApplication } from '../model/onecx-application-type'

export class OneCXUiContainer extends OneCXAppContainer {
  constructor(
    image: string,
    aliasAndName: string,
    applicationName: OneCXCoreApplication | string,
    network: StartedNetwork
  ) {
    super(image, aliasAndName, 'UI', applicationName, network)

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment()
    }).withOneCXExposedPort(8080)
  }

  public async start(): Promise<StartedOneCXUiContainer> {
    return new StartedOneCXUiContainer(
      await super.start(),
      this.getOneCXAppType(),
      this.getOneCXApplicationName(),
      this.getOneCXAlias()
    )
  }
}

export class StartedOneCXUiContainer extends StartedOneCXAppContainer {}

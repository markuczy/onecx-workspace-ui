import { StartedNetwork } from 'testcontainers'
import { OneCXAppContainer, StartedOneCXAppContainer } from './onecx-app'

export class OneCXUiContainer extends OneCXAppContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, network)

    this.withOneCXAppType('UI')
      .withOneCXEnvironment({
        ...this.getOneCXEnvironment()
      })
      .withOneCXExposedPort(8080)
  }

  public async start(): Promise<StartedOneCXUiContainer> {
    return new StartedOneCXUiContainer(await super.start(), this.getOneCXAppType(), this.getOneCXAlias())
  }
}

export class StartedOneCXUiContainer extends StartedOneCXAppContainer {}

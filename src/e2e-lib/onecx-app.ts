import { StartedNetwork, StartedTestContainer } from 'testcontainers'
import { OneCXContainer, StartedOneCXContainer } from './onecx-container'

export type AppType = 'SVC' | 'BFF' | 'UI'

export class OneCXAppContainer extends OneCXContainer {
  private onecxAppType: AppType
  constructor(image: string, network: StartedNetwork) {
    super(image, network)
  }

  public withOneCXAppType(appType: AppType) {
    this.onecxAppType = appType
    return this
  }

  public getOneCXAppType() {
    return this.onecxAppType
  }

  public async start(): Promise<StartedOneCXAppContainer> {
    return new StartedOneCXAppContainer(await super.start(), this.onecxAppType, this.getOneCXAlias())
  }
}

export class StartedOneCXAppContainer extends StartedOneCXContainer {
  constructor(
    startedTestContainer: StartedTestContainer,
    private readonly onecxAppType: AppType,
    alias?: string
  ) {
    super(startedTestContainer, alias)
  }
  public getOneCXAppType() {
    return this.onecxAppType
  }
}

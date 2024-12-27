import { StartedNetwork, StartedTestContainer } from 'testcontainers'
import { OneCXContainer, StartedOneCXContainer } from './onecx-container'
import { OneCXAppType } from '../model/onecx-app-type'
import { OneCXCoreApplication } from '../model/onecx-application-type'

export class OneCXAppContainer extends OneCXContainer {
  private onecxAppType: OneCXAppType
  private onecxApplicationName: OneCXCoreApplication | string
  constructor(
    image: string,
    aliasAndName: string,
    appType: OneCXAppType,
    applicationName: OneCXCoreApplication | string,
    network: StartedNetwork
  ) {
    super(image, aliasAndName, network)

    this.onecxAppType = appType
    this.onecxApplicationName = applicationName
  }

  public getOneCXAppType() {
    return this.onecxAppType
  }

  public getOneCXApplicationName() {
    return this.onecxApplicationName
  }

  public withOnecxApplicationName(applicationName: string) {
    this.onecxApplicationName = applicationName
    return this
  }

  public async start(): Promise<StartedOneCXAppContainer> {
    return new StartedOneCXAppContainer(
      await super.start(),
      this.onecxAppType,
      this.onecxApplicationName,
      this.getOneCXAlias()
    )
  }
}

export class StartedOneCXAppContainer extends StartedOneCXContainer {
  constructor(
    startedTestContainer: StartedTestContainer,
    private readonly onecxAppType: OneCXAppType,
    private readonly onecxApplicationName: OneCXCoreApplication | string,
    alias: string
  ) {
    super(startedTestContainer, alias)
  }

  public getOneCXAppType() {
    return this.onecxAppType
  }

  public getOneCXApplicationName() {
    return this.onecxApplicationName
  }
}

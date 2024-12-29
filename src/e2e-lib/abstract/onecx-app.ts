import { StartedNetwork, StartedTestContainer } from 'testcontainers'
import { OneCXContainer, StartedOneCXContainer } from './onecx-container'
import { OneCXAppType } from '../model/onecx-app-type'
import { OneCXCoreApplication } from '../model/onecx-application-type'

export interface OneCXAppDetails {
  appType: OneCXAppType
  applicationName: OneCXCoreApplication | string
  appId: string
}

export class OneCXAppContainer extends OneCXContainer {
  private onecxAppDetails: OneCXAppDetails
  constructor(image: string, aliasAndName: string, appDetails: OneCXAppDetails, network: StartedNetwork) {
    super(image, aliasAndName, network)

    this.onecxAppDetails = appDetails
  }

  public getOneCXAppDetails() {
    return this.onecxAppDetails
  }

  public async start(): Promise<StartedOneCXAppContainer> {
    return new StartedOneCXAppContainer(
      await super.start(),
      this.onecxAppDetails,
      this.getOneCXAlias(),
      this.getOneCXNetwork(),
      this.getOneCXExposedPort()
    )
  }
}

export class StartedOneCXAppContainer extends StartedOneCXContainer {
  constructor(
    startedTestContainer: StartedTestContainer,
    private readonly onecxAppDetails: OneCXAppDetails,
    alias: string,
    network: StartedNetwork,
    exposedPort: number | undefined
  ) {
    super(startedTestContainer, alias, network, exposedPort)
  }

  public getOneCXAppType() {
    return this.onecxAppDetails.appType
  }

  public getOneCXApplicationName() {
    return this.onecxAppDetails.applicationName
  }

  public getOneCXAppId() {
    return this.onecxAppDetails.appId
  }
}

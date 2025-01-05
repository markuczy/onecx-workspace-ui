import { StartedNetwork, StartedTestContainer } from 'testcontainers'
import { IOneCXContainer, OneCXContainer, StartedOneCXContainer } from './onecx-container'
import { OneCXAppType } from '../model/onecx-app-type'
import { OneCXCoreApplication } from '../model/onecx-application-type'

/**
 * Details of the OneCX App describing its relation with an Application
 */
export interface OneCXAppDetails {
  appType: OneCXAppType
  applicationName: OneCXCoreApplication | string
  appId: string
}

/**
 * Defined or started OneCX App container interface
 */
export interface IOneCXAppContainer extends IOneCXContainer {
  getOneCXAppType(): OneCXAppType
  getOneCXApplicationName(): OneCXCoreApplication | string
  getOneCXAppId(): string
}

/**
 * Defined OneCX App container
 */
export class OneCXAppContainer extends OneCXContainer implements IOneCXAppContainer {
  private onecxAppDetails: OneCXAppDetails
  constructor(image: string, name: string, alias: string, appDetails: OneCXAppDetails, network: StartedNetwork) {
    super(image, name, alias, network)

    this.onecxAppDetails = appDetails
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

  public override async start(): Promise<StartedOneCXAppContainer> {
    return new StartedOneCXAppContainer(
      await super.start(),
      this.onecxAppDetails,
      this.getOneCXName(),
      this.getOneCXAlias(),
      this.getOneCXNetwork(),
      this.getOneCXExposedPort()
    )
  }
}

/**
 * Started OneCX App container
 */
export class StartedOneCXAppContainer extends StartedOneCXContainer implements IOneCXAppContainer {
  constructor(
    startedTestContainer: StartedTestContainer,
    private readonly onecxAppDetails: OneCXAppDetails,
    onecxName: string,
    onecxAlias: string,
    onecxNetwork: StartedNetwork,
    onecxExposedPort: number | undefined
  ) {
    super(startedTestContainer, onecxAlias, onecxName, onecxNetwork, onecxExposedPort)
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

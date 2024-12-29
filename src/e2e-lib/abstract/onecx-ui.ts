import { StartedNetwork } from 'testcontainers'
import { OneCXAppContainer, StartedOneCXAppContainer } from './onecx-app'
import { OneCXCoreApplication } from '../model/onecx-application-type'

export class OneCXUiContainer extends OneCXAppContainer {
  constructor(
    image: string,
    aliasAndName: string,
    applicationName: OneCXCoreApplication | string,
    appId: string,
    network: StartedNetwork
  ) {
    super(
      image,
      aliasAndName,
      {
        appId: appId,
        applicationName: applicationName,
        appType: 'UI'
      },
      network
    )

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment()
    }).withOneCXExposedPort(8080)
  }
}

export class StartedOneCXUiContainer extends StartedOneCXAppContainer {}

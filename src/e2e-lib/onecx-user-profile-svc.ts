import { StartedNetwork } from 'testcontainers'
import { OneCXSvcContainer, StartedOneCXSvcContainer } from './onecx-svc'

// TODO: Username and password is bounded to the db create scripts
// TODO: JDBC URL improvement??
export class OneCXUserProfileSvcContainer extends OneCXSvcContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, network)

    this.withOneCXNameAndAlias('onecx-user-profile-svc').withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      QUARKUS_DATASOURCE_USERNAME: 'onecx_user_profile',
      QUARKUS_DATASOURCE_PASSWORD: 'onecx_user_profile',
      QUARKUS_DATASOURCE_JDBC_URL: `jdbc:postgresql://${this.getOneCXDatabaseContainerName()}:5432/onecx_user_profile?sslmode=disable`
    })
  }

  async start(): Promise<StartedOneCXUserProfileSvcContainer> {
    return new StartedOneCXUserProfileSvcContainer(await super.start(), this.getOneCXAppType(), this.getOneCXAlias())
  }
}

export class StartedOneCXUserProfileSvcContainer extends StartedOneCXSvcContainer {}

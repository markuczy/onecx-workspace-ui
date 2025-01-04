import { OneCXSvcContainer, OneCXSvcContainerServices } from '../abstract/onecx-svc'

export class OneCXUserProfileSvcContainer extends OneCXSvcContainer {
  constructor(image: string, services: OneCXSvcContainerServices) {
    super(
      image,
      { nameAndAlias: 'onecx-user-profile-svc', applicationName: 'user-profile', appId: 'user-profile-svc' },
      services
    )

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      QUARKUS_DATASOURCE_USERNAME: 'onecx_user_profile',
      QUARKUS_DATASOURCE_PASSWORD: 'onecx_user_profile',
      QUARKUS_DATASOURCE_JDBC_URL: `jdbc:postgresql://${this.getOneCXDatabaseContainer().getOneCXAlias()}:${this.getOneCXDatabaseContainer().getOneCXExposedPort()}/onecx_user_profile?sslmode=disable`
    })
  }
}

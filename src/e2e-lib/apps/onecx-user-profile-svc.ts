import { OneCXSvcContainer, OneCXSvcContainerServices } from '../abstract/onecx-svc'
import { OneCXCoreApplication, OneCXCoreApplications } from '../model/onecx-application-type'

export class OneCXUserProfileSvcContainer extends OneCXSvcContainer {
  constructor(image: string, services: OneCXSvcContainerServices) {
    super(
      image,
      {
        name: 'onecx-user-profile-svc',
        alias: 'onecx-user-profile-svc',
        applicationName: OneCXCoreApplications.USER_PROFILE satisfies OneCXCoreApplication,
        appId: 'user-profile-svc'
      },
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

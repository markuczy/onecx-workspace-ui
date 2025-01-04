import { OneCXSvcContainer, OneCXSvcContainerServices } from '../abstract/onecx-svc'

export class OneCXThemeSvcContainer extends OneCXSvcContainer {
  constructor(image: string, services: OneCXSvcContainerServices) {
    super(image, { nameAndAlias: 'onecx-theme-svc', applicationName: 'theme', appId: 'theme-svc' }, services)

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      QUARKUS_DATASOURCE_USERNAME: 'onecx_theme',
      QUARKUS_DATASOURCE_PASSWORD: 'onecx_theme',
      QUARKUS_DATASOURCE_JDBC_URL: `jdbc:postgresql://${this.getOneCXDatabaseContainer().getOneCXAlias()}:${this.getOneCXDatabaseContainer().getOneCXExposedPort()}/onecx_theme?sslmode=disable`
    })
  }
}

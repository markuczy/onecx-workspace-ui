import { OneCXSvcContainer, OneCXSvcContainerServices } from '../abstract/onecx-svc'
import { OneCXCoreApplication, OneCXCoreApplications } from '../model/onecx-application-type'

export class OneCXIamKcSvcContainer extends OneCXSvcContainer {
  constructor(image: string, services: OneCXSvcContainerServices) {
    super(
      image,
      {
        name: 'onecx-iam-kc-svc',
        alias: 'onecx-iam-kc-svc',
        applicationName: OneCXCoreApplications.IAM satisfies OneCXCoreApplication,
        appId: 'iam-kc-svc'
      },
      services
    )

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      QUARKUS_KEYCLOAK_ADMIN_CLIENT_SERVER_URL: `http://${this.getOneCXKeycloakContainer().getOneCXAlias()}:${this.getOneCXKeycloakContainer().getOneCXExposedPort()}`,
      QUARKUS_KEYCLOAK_ADMIN_CLIENT_REALM: `${this.getOneCXKeycloakContainer().getOneCXAdminRealm()}`,
      QUARKUS_KEYCLOAK_ADMIN_CLIENT_USERNAME: `${this.getOneCXKeycloakContainer().getOneCXAdminUsername()}`,
      QUARKUS_KEYCLOAK_ADMIN_CLIENT_PASSWORD: `${this.getOneCXKeycloakContainer().getOneCXAdminPassword()}`
    })
  }
}

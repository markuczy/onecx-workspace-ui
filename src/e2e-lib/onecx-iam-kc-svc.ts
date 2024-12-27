import { StartedNetwork } from 'testcontainers'
import { OneCXSvcContainer, StartedOneCXSvcContainer } from './onecx-svc'

// TODO: Keycloak container port static
// TODO: Keycloak data static
export class OneCXIamKcSvcContainer extends OneCXSvcContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, network)

    this.withOneCXNameAndAlias('onecx-iam-kc-svc').withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      QUARKUS_KEYCLOAK_ADMIN_CLIENT_SERVER_URL: `http://${this.getOneCXKeycloakContainerName()}:8080`,
      QUARKUS_KEYCLOAK_ADMIN_CLIENT_REALM: 'master',
      QUARKUS_KEYCLOAK_ADMIN_CLIENT_USERNAME: 'admin',
      QUARKUS_KEYCLOAK_ADMIN_CLIENT_PASSWORD: 'admin'
    })
  }

  async start(): Promise<StartedOneCXIamKcSvcContainer> {
    return new StartedOneCXIamKcSvcContainer(await super.start(), this.getOneCXAppType(), this.getOneCXAlias())
  }
}

export class StartedOneCXIamKcSvcContainer extends StartedOneCXSvcContainer {}

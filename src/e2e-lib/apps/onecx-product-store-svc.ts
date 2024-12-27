import { StartedNetwork } from 'testcontainers'
import { OneCXSvcContainer, StartedOneCXSvcContainer } from '../abstract/onecx-svc'
import { StartedOneCXPostgresContainer } from '../core/onecx-postgres'
import { StartedOneCXKeycloakContainer } from '../core/onecx-keycloak'

export class OneCXProductStoreSvcContainer extends OneCXSvcContainer {
  constructor(
    image: string,
    network: StartedNetwork,
    databaseContainer: StartedOneCXPostgresContainer,
    keycloakContainer: StartedOneCXKeycloakContainer
  ) {
    super(image, 'onecx-product-store-svc', 'product-store', network, databaseContainer, keycloakContainer)

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      QUARKUS_DATASOURCE_USERNAME: 'onecx_product_store',
      QUARKUS_DATASOURCE_PASSWORD: 'onecx_product_store',
      QUARKUS_DATASOURCE_JDBC_URL: `jdbc:postgresql://${this.getOneCXDatabaseContainerName()}:${this.getOneCXDatabaseExposedPort}/onecx_product_store?sslmode=disable`
    })
  }

  async start(): Promise<StartedOneCXProductStoreSvcContainer> {
    return new StartedOneCXProductStoreSvcContainer(
      await super.start(),
      this.getOneCXAppType(),
      this.getOneCXApplicationName(),
      this.getOneCXAlias()
    )
  }
}

export class StartedOneCXProductStoreSvcContainer extends StartedOneCXSvcContainer {}

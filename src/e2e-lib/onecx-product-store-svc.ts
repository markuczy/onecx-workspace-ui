import { StartedNetwork } from 'testcontainers'
import { OneCXSvcContainer, StartedOneCXSvcContainer } from './onecx-svc'

// TODO: Username and password is bounded to the db create scripts
// TODO: JDBC URL improvement??
export class OneCXProductStoreSvcContainer extends OneCXSvcContainer {
  constructor(image: string, network: StartedNetwork) {
    super(image, network)

    this.withOneCXNameAndAlias('onecx-product-store-svc').withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      QUARKUS_DATASOURCE_USERNAME: 'onecx_product_store',
      QUARKUS_DATASOURCE_PASSWORD: 'onecx_product_store',
      QUARKUS_DATASOURCE_JDBC_URL: `jdbc:postgresql://${this.getOneCXDatabaseContainerName()}:5432/onecx_product_store?sslmode=disable`
    })
  }

  async start(): Promise<StartedOneCXProductStoreSvcContainer> {
    return new StartedOneCXProductStoreSvcContainer(await super.start(), this.getOneCXAppType(), this.getOneCXAlias())
  }
}

export class StartedOneCXProductStoreSvcContainer extends StartedOneCXSvcContainer {}

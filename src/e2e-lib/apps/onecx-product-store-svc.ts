import { OneCXSvcContainer, OneCXSvcContainerServices } from '../abstract/onecx-svc'

export class OneCXProductStoreSvcContainer extends OneCXSvcContainer {
  constructor(image: string, services: OneCXSvcContainerServices) {
    super(
      image,
      {
        name: 'onecx-product-store-svc',
        alias: 'onecx-product-store-svc',
        applicationName: 'product-store',
        appId: 'product-store-svc'
      },
      services
    )

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      QUARKUS_DATASOURCE_USERNAME: 'onecx_product_store',
      QUARKUS_DATASOURCE_PASSWORD: 'onecx_product_store',
      QUARKUS_DATASOURCE_JDBC_URL: `jdbc:postgresql://${this.getOneCXDatabaseContainer().getOneCXAlias()}:${this.getOneCXDatabaseContainer().getOneCXExposedPort()}/onecx_product_store?sslmode=disable`
    })
  }
}

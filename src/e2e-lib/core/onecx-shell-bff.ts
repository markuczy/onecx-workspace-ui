import { OneCXBffContainer, OneCXBffContainerServices } from '../abstract/onecx-bff'

export class OneCXShellBffContainer extends OneCXBffContainer {
  constructor(image: string, services: OneCXBffContainerServices) {
    super(image, { nameAndAlias: 'onecx-shell-bff', applicationName: 'shell', appId: 'shell-bff' }, services)

    this.withOneCXHealthCheck({
      test: ['CMD-SHELL', `curl --head -fsS http://localhost:8080/q/health`],
      interval: 10_000,
      timeout: 5_000,
      retries: 3,
      startPeriod: 10_000
    }).withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      ONECX_PERMISSIONS_PRODUCT_NAME: 'onecx-shell'
    })
  }
}

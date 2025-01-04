import { OneCXUiContainer, OneCXUiContainerServices } from '../abstract/onecx-ui'

export class OneCXWorkspaceUiContainer extends OneCXUiContainer {
  constructor(image: string, services: OneCXUiContainerServices) {
    super(image, { nameAndAlias: 'onecx-workspace-ui', applicationName: 'workspace', appId: 'workspace-ui' }, services)

    this.withOneCXEnvironment({
      ...this.getOneCXEnvironment(),
      APP_BASE_HREF: '/mfe/workspace/',
      APP_ID: 'onecx-workspace-ui',
      PRODUCT_NAME: 'onecx-workspace'
    })
  }
}

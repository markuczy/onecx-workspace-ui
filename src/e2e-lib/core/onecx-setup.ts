import { StartedNetwork } from 'testcontainers'
import { OneCXPostgresContainer } from './onecx-postgres'
import { OneCXKeycloakContainer } from './onecx-keycloak'
import { OneCXSvcContainer } from '../abstract/onecx-svc'
import { OneCXAppSet } from '../abstract/onecx-app-set'
import { OneCXBffContainer } from '../abstract/onecx-bff'
import { OneCXUiContainer } from '../abstract/onecx-ui'
import { containerImagesEnv } from '../constants/e2e-config'
import path from 'path'
import { OneCXContainer } from '../abstract/onecx-container'
import { OneCXThemeSvcContainer } from '../apps/onecx-theme-svc'
import { OneCXAppContainer } from '../abstract/onecx-app'
import { OneCXAppType } from '../model/onecx-app-type'
import { OneCXTenantSvcContainer } from '../apps/onecx-tenant-svc'
import { OneCXPermissionSvcContainer } from '../apps/onecx-permission-svc'
import { OneCXProductStoreSvcContainer } from '../apps/onecx-product-store-svc'
import { OneCXUserProfileSvcContainer } from '../apps/onecx-user-profile-svc'
import { OneCXIamKcSvcContainer } from '../apps/onecx-iam-kc-svc'
import { OneCXWorkspaceSvcContainer } from '../apps/onecx-workspace-svc'
import { OneCXShellBffContainer } from './onecx-shell-bff'
import { OneCXShellUiContainer } from './onecx-shell-ui'

export interface OneCXSetup {
  network: StartedNetwork
  database: OneCXPostgresContainer
  keycloak: OneCXKeycloakContainer
  services: OneCXAppSet<OneCXSvcContainer>
  bffs: OneCXAppSet<OneCXBffContainer>
  uis: OneCXAppSet<OneCXUiContainer>

  withApp(type: OneCXAppType, container: OneCXAppContainer): void
}

export interface OneCXBaseSetupParams {
  namePrefix?: string
}

export class OneCXBaseSetup implements OneCXSetup {
  network: StartedNetwork
  database: OneCXPostgresContainer
  keycloak: OneCXKeycloakContainer
  services: OneCXAppSet<OneCXSvcContainer> = new OneCXAppSet()
  bffs: OneCXAppSet<OneCXBffContainer> = new OneCXAppSet()
  uis: OneCXAppSet<OneCXUiContainer> = new OneCXAppSet()

  private namePrefix: string | undefined

  constructor(network: StartedNetwork, params?: OneCXBaseSetupParams) {
    this.network = network
    this.namePrefix = params?.namePrefix

    this.database = this.setupDatabase(this.network)
    this.keycloak = this.setupKeycloak(this.network, this.database)
    this.setupApps(this.network, this.database, this.keycloak)
  }

  public withApp(type: OneCXAppType, container: OneCXAppContainer): void {
    switch (type) {
      case 'SVC':
        this.addApp<OneCXSvcContainer>(this.services, container as OneCXSvcContainer)
        break
      case 'BFF':
        this.addApp<OneCXBffContainer>(this.bffs, container as OneCXBffContainer)
        break
      case 'UI':
        this.addApp<OneCXUiContainer>(this.uis, container as OneCXUiContainer)
        break
    }
  }

  private setupApps(
    network: StartedNetwork,
    databaseContainer: OneCXPostgresContainer,
    keycloakContainer: OneCXKeycloakContainer
  ) {
    this.setupThemeSvc(network, databaseContainer, keycloakContainer)
    const tenantSvc = this.setupTenantSvc(network, databaseContainer, keycloakContainer)
    this.setupPermissionSvc(network, databaseContainer, keycloakContainer, tenantSvc)
    this.setupProductStoreSvc(network, databaseContainer, keycloakContainer)
    this.setupUserProfileSvc(network, databaseContainer, keycloakContainer)
    this.setupIamKcSvc(network, databaseContainer, keycloakContainer)
    this.setupWorkspaceSvc(network, databaseContainer, keycloakContainer)

    this.setupShellBff(this.network, keycloakContainer)

    this.setupShellUi(this.network, keycloakContainer)
  }

  // TODO: There should be default db data and path to it
  private setupDatabase(network: StartedNetwork) {
    const db = new OneCXPostgresContainer(containerImagesEnv.POSTGRES, network, path.resolve('e2e-tests/init-data/db'))

    return this.prefixedContainer(db)
  }

  // TODO: There should be default db data and path to it
  private setupKeycloak(network: StartedNetwork, databaseContainer: OneCXPostgresContainer) {
    const keycloak = new OneCXKeycloakContainer(
      containerImagesEnv.KEYCLOAK,
      network,
      databaseContainer,
      path.resolve('e2e-tests/init-data/keycloak/imports')
    )

    return this.prefixedContainer(keycloak)
  }

  private setupThemeSvc(
    network: StartedNetwork,
    databaseContainer: OneCXPostgresContainer,
    keycloakContainer: OneCXKeycloakContainer
  ): OneCXThemeSvcContainer {
    const themeSvc = new OneCXThemeSvcContainer(containerImagesEnv.ONECX_THEME_SVC, {
      network,
      databaseContainer,
      keycloakContainer
    })
    return this.addApp<OneCXSvcContainer>(this.services, themeSvc)
  }

  private setupTenantSvc(
    network: StartedNetwork,
    databaseContainer: OneCXPostgresContainer,
    keycloakContainer: OneCXKeycloakContainer
  ) {
    const tenantSvc = new OneCXTenantSvcContainer(containerImagesEnv.ONECX_TENANT_SVC, {
      network,
      databaseContainer,
      keycloakContainer
    })
    return this.addApp<OneCXSvcContainer>(this.services, tenantSvc)
  }

  private setupPermissionSvc(
    network: StartedNetwork,
    databaseContainer: OneCXPostgresContainer,
    keycloakContainer: OneCXKeycloakContainer,
    tenantContainer: OneCXTenantSvcContainer
  ) {
    const permissionSvc = new OneCXPermissionSvcContainer(containerImagesEnv.ONECX_PERMISSION_SVC, {
      network,
      databaseContainer,
      keycloakContainer,
      tenantContainer
    })
    return this.addApp<OneCXSvcContainer>(this.services, permissionSvc)
  }

  private setupProductStoreSvc(
    network: StartedNetwork,
    databaseContainer: OneCXPostgresContainer,
    keycloakContainer: OneCXKeycloakContainer
  ) {
    const productStoreSvc = new OneCXProductStoreSvcContainer(containerImagesEnv.ONECX_PRODUCT_STORE_SVC, {
      network,
      databaseContainer,
      keycloakContainer
    })
    return this.addApp<OneCXSvcContainer>(this.services, productStoreSvc)
  }

  private setupUserProfileSvc(
    network: StartedNetwork,
    databaseContainer: OneCXPostgresContainer,
    keycloakContainer: OneCXKeycloakContainer
  ) {
    const userProfileSvc = new OneCXUserProfileSvcContainer(containerImagesEnv.ONECX_USER_PROFILE_SVC, {
      network,
      databaseContainer,
      keycloakContainer
    })
    return this.addApp<OneCXSvcContainer>(this.services, userProfileSvc)
  }

  private setupIamKcSvc(
    network: StartedNetwork,
    databaseContainer: OneCXPostgresContainer,
    keycloakContainer: OneCXKeycloakContainer
  ) {
    const iamKcSvc = new OneCXIamKcSvcContainer(containerImagesEnv.ONECX_IAM_KC_SVC, {
      network,
      databaseContainer,
      keycloakContainer
    })
    return this.addApp<OneCXSvcContainer>(this.services, iamKcSvc)
  }

  private setupWorkspaceSvc(
    network: StartedNetwork,
    databaseContainer: OneCXPostgresContainer,
    keycloakContainer: OneCXKeycloakContainer
  ) {
    const workspaceSvc = new OneCXWorkspaceSvcContainer(containerImagesEnv.ONECX_WORKSPACE_SVC, {
      network,
      databaseContainer,
      keycloakContainer
    })
    return this.addApp<OneCXSvcContainer>(this.services, workspaceSvc)
  }

  private setupShellBff(network: StartedNetwork, keycloakContainer: OneCXKeycloakContainer) {
    const shellBff = new OneCXShellBffContainer(containerImagesEnv.ONECX_SHELL_BFF, { network, keycloakContainer })
    return this.addApp<OneCXBffContainer>(this.bffs, shellBff)
  }

  private setupShellUi(network: StartedNetwork, keycloakContainer: OneCXKeycloakContainer) {
    const shellUi = new OneCXShellUiContainer(containerImagesEnv.ONECX_SHELL_UI, { network, keycloakContainer })
    return this.addApp<OneCXUiContainer>(this.uis, shellUi)
  }

  private addApp<T extends OneCXAppContainer>(set: OneCXAppSet<T>, container: T) {
    const prefixedContainer = this.prefixedContainer(container)
    set.replace(prefixedContainer)

    return prefixedContainer
  }

  private prefixedContainer<T extends OneCXContainer>(container: T) {
    if (this.namePrefix && container.getOneCXName().startsWith(this.namePrefix)) return container

    this.namePrefix && container.withOneCXName(this.namePrefix.concat(container.getOneCXName()))
    return container
  }
}

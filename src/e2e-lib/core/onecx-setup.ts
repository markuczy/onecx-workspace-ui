import { StartedNetwork } from 'testcontainers'
import { OneCXPostgresContainer } from './onecx-postgres'
import { OneCXKeycloakContainer } from './onecx-keycloak'
import { OneCXSvcContainer } from '../abstract/onecx-svc'
import { OneCXAppSet } from './onecx-app-set'
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
import { OneCXShellBffContainer } from '../apps/onecx-shell-bff'
import { OneCXShellUiContainer } from '../apps/onecx-shell-ui'
import { OneCXThemeBffContainer } from '../apps/onecx-theme-bff'
import { OneCXTenantBffContainer } from '../apps/onecx-tenant-bff'
import { OneCXPermissionBffContainer } from '../apps/onecx-permission-bff'
import { OneCXProductStoreBffContainer } from '../apps/onecx-product-store-bff'
import { OneCXUserProfileBffContainer } from '../apps/onecx-user-profile-bff'
import { OneCXIamBffContainer } from '../apps/onecx-iam-bff'
import { OneCXWorkspaceBffContainer } from '../apps/onecx-workspace-bff'
import { OneCXThemeUiContainer } from '../apps/onecx-theme-ui'
import { OneCXTenantUiContainer } from '../apps/onecx-tenant-ui'
import { OneCXPermissionUiContainer } from '../apps/onecx-permission-ui'
import { OneCXProductStoreUiContainer } from '../apps/onecx-product-store-ui'
import { OneCXUserProfileUiContainer } from '../apps/onecx-user-profile-ui'
import { OneCXIamUiContainer } from '../apps/onecx-iam-ui'
import { OneCXWorkspaceUiContainer } from '../apps/onecx-workspace-ui'
import { OneCXCoreApplication, OneCXCoreApplications } from '../model/onecx-application-type'

export interface OneCXSetup {
  network: StartedNetwork
  database: OneCXPostgresContainer
  keycloak: OneCXKeycloakContainer
  services: OneCXAppSet<OneCXSvcContainer>
  bffs: OneCXAppSet<OneCXBffContainer>
  uis: OneCXAppSet<OneCXUiContainer>
  coreApps: OneCXAppSet<OneCXAppContainer>
  containers: Array<OneCXContainer>

  withApp(type: OneCXAppType, container: OneCXAppContainer): void
  withContainer(container: OneCXContainer): void
}

export interface OneCXBaseSetupParams {
  namePrefix?: string
  aggregateContainers?: boolean
}

export class OneCXBaseSetup implements OneCXSetup {
  network: StartedNetwork
  database: OneCXPostgresContainer
  keycloak: OneCXKeycloakContainer
  services: OneCXAppSet<OneCXSvcContainer> = new OneCXAppSet()
  bffs: OneCXAppSet<OneCXBffContainer> = new OneCXAppSet()
  uis: OneCXAppSet<OneCXUiContainer> = new OneCXAppSet()
  coreApps: OneCXAppSet<OneCXAppContainer> = new OneCXAppSet()
  containers: Array<OneCXContainer> = []

  protected namePrefix: string | undefined
  protected aggregateContainers = false

  constructor(network: StartedNetwork, params?: OneCXBaseSetupParams) {
    this.network = network
    this.namePrefix = params?.namePrefix
    this.aggregateContainers = params?.aggregateContainers ?? this.aggregateContainers

    this.database = this.setupDatabase(this.network)
    this.keycloak = this.setupKeycloak(this.network, this.database)
    this.setupBaseApps(this.network, this.database, this.keycloak)
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

  public withContainer(container: OneCXContainer): void {
    this.addContainer(container)
  }

  private setupBaseApps(
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

    const coreApps = [...this.services.values(), ...this.bffs.values(), ...this.uis.values()]
    coreApps.forEach((app) => this.coreApps.add(app))
  }

  protected setupDatabase(network: StartedNetwork) {
    const db = new OneCXPostgresContainer(containerImagesEnv.POSTGRES, network)

    return this.prefixedContainer(db)
  }

  protected setupKeycloak(network: StartedNetwork, databaseContainer: OneCXPostgresContainer) {
    const keycloak = new OneCXKeycloakContainer(containerImagesEnv.KEYCLOAK, network, databaseContainer)

    return this.prefixedContainer(keycloak)
  }

  protected setupThemeSvc(
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

  protected setupTenantSvc(
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

  protected setupPermissionSvc(
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

  protected setupProductStoreSvc(
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

  protected setupUserProfileSvc(
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

  protected setupIamKcSvc(
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

  protected setupWorkspaceSvc(
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

  protected setupShellBff(network: StartedNetwork, keycloakContainer: OneCXKeycloakContainer) {
    const shellBff = new OneCXShellBffContainer(containerImagesEnv.ONECX_SHELL_BFF, { network, keycloakContainer })
    return this.addApp<OneCXBffContainer>(this.bffs, shellBff)
  }

  protected setupShellUi(network: StartedNetwork, keycloakContainer: OneCXKeycloakContainer) {
    const shellUi = new OneCXShellUiContainer(containerImagesEnv.ONECX_SHELL_UI, { network, keycloakContainer })
    return this.addApp<OneCXUiContainer>(this.uis, shellUi)
  }

  protected addContainer(container: OneCXContainer) {
    const prefixedContainer = this.prefixedContainer(container)
    this.containers.push(prefixedContainer)

    return prefixedContainer
  }

  protected addApp<T extends OneCXAppContainer>(set: OneCXAppSet<T>, container: T) {
    const prefixedContainer = this.prefixedContainer(container)
    set.replace(prefixedContainer)
    this.aggregateContainers && this.containers.push(prefixedContainer)

    return prefixedContainer
  }

  protected prefixedContainer<T extends OneCXContainer>(container: T) {
    if (this.namePrefix && container.getOneCXName().startsWith(this.namePrefix)) return container

    this.namePrefix && container.withOneCXName(this.namePrefix.concat(container.getOneCXName()))
    return container
  }
}

export interface OneCXExtendedSetupParams extends OneCXBaseSetupParams {
  extension: 'partial' | 'all'
  applicationList?: Array<OneCXCoreApplication | string>
}

export class OneCXExtendedSetup extends OneCXBaseSetup {
  applicationList: Array<OneCXCoreApplication | string> = []
  constructor(network: StartedNetwork, params: OneCXExtendedSetupParams) {
    super(network, params)

    if (params.extension === 'all') {
      this.applicationList = [
        OneCXCoreApplications.THEME,
        OneCXCoreApplications.PERMISSION,
        OneCXCoreApplications.PRODUCT_STORE,
        OneCXCoreApplications.USER_PROFILE,
        OneCXCoreApplications.IAM,
        OneCXCoreApplications.TENANT,
        OneCXCoreApplications.WORKSPACE
      ] satisfies Array<OneCXCoreApplication>
    } else {
      this.applicationList = params.applicationList ?? []
    }
    this.setupExtendedApps(this.network, this.keycloak)
  }

  private setupExtendedApps(network: StartedNetwork, keycloakContainer: OneCXKeycloakContainer) {
    this.applicationList.includes(OneCXCoreApplications.THEME) &&
      this.setupThemeBff(network, keycloakContainer) &&
      this.setupThemeUi(network, keycloakContainer)

    this.applicationList.includes(OneCXCoreApplications.TENANT) &&
      this.setupTenantBff(network, keycloakContainer) &&
      this.setupTenantUi(network, keycloakContainer)

    this.applicationList.includes(OneCXCoreApplications.PERMISSION) &&
      this.setupPermissionBff(network, keycloakContainer) &&
      this.setupPermissionUi(network, keycloakContainer)

    this.applicationList.includes(OneCXCoreApplications.PRODUCT_STORE) &&
      this.setupProductStoreBff(network, keycloakContainer) &&
      this.setupProductStoreUi(network, keycloakContainer)

    this.applicationList.includes(OneCXCoreApplications.USER_PROFILE) &&
      this.setupUserProfileBff(network, keycloakContainer) &&
      this.setupUserProfileUi(network, keycloakContainer)

    this.applicationList.includes(OneCXCoreApplications.IAM) &&
      this.setupIamBff(network, keycloakContainer) &&
      this.setupIamUi(network, keycloakContainer)

    this.applicationList.includes(OneCXCoreApplications.WORKSPACE) &&
      this.setupWorkspaceBff(network, keycloakContainer) &&
      this.setupWorkspaceUi(network, keycloakContainer)
  }

  protected setupThemeBff(network: StartedNetwork, keycloakContainer: OneCXKeycloakContainer) {
    const bff = new OneCXThemeBffContainer(containerImagesEnv.ONECX_THEME_BFF, {
      network,
      keycloakContainer
    })
    return this.addApp<OneCXBffContainer>(this.bffs, bff)
  }

  protected setupThemeUi(network: StartedNetwork, keycloakContainer: OneCXKeycloakContainer) {
    const ui = new OneCXThemeUiContainer(containerImagesEnv.ONECX_THEME_UI, {
      network,
      keycloakContainer
    })
    return this.addApp<OneCXUiContainer>(this.uis, ui)
  }

  protected setupTenantBff(network: StartedNetwork, keycloakContainer: OneCXKeycloakContainer) {
    const bff = new OneCXTenantBffContainer(containerImagesEnv.ONECX_TENANT_BFF, {
      network,
      keycloakContainer
    })
    return this.addApp<OneCXBffContainer>(this.bffs, bff)
  }

  protected setupTenantUi(network: StartedNetwork, keycloakContainer: OneCXKeycloakContainer) {
    const ui = new OneCXTenantUiContainer(containerImagesEnv.ONECX_TENANT_UI, {
      network,
      keycloakContainer
    })
    return this.addApp<OneCXUiContainer>(this.uis, ui)
  }

  protected setupPermissionBff(network: StartedNetwork, keycloakContainer: OneCXKeycloakContainer) {
    const bff = new OneCXPermissionBffContainer(containerImagesEnv.ONECX_PERMISSION_BFF, {
      network,
      keycloakContainer
    })
    return this.addApp<OneCXBffContainer>(this.bffs, bff)
  }

  protected setupPermissionUi(network: StartedNetwork, keycloakContainer: OneCXKeycloakContainer) {
    const ui = new OneCXPermissionUiContainer(containerImagesEnv.ONECX_PERMISSION_UI, {
      network,
      keycloakContainer
    })
    return this.addApp<OneCXUiContainer>(this.uis, ui)
  }

  protected setupProductStoreBff(network: StartedNetwork, keycloakContainer: OneCXKeycloakContainer) {
    const bff = new OneCXProductStoreBffContainer(containerImagesEnv.ONECX_PRODUCT_STORE_BFF, {
      network,
      keycloakContainer
    })
    return this.addApp<OneCXBffContainer>(this.bffs, bff)
  }

  protected setupProductStoreUi(network: StartedNetwork, keycloakContainer: OneCXKeycloakContainer) {
    const ui = new OneCXProductStoreUiContainer(containerImagesEnv.ONECX_PRODUCT_STORE_UI, {
      network,
      keycloakContainer
    })
    return this.addApp<OneCXUiContainer>(this.uis, ui)
  }

  protected setupUserProfileBff(network: StartedNetwork, keycloakContainer: OneCXKeycloakContainer) {
    const bff = new OneCXUserProfileBffContainer(containerImagesEnv.ONECX_USER_PROFILE_BFF, {
      network,
      keycloakContainer
    })
    return this.addApp<OneCXBffContainer>(this.bffs, bff)
  }

  protected setupUserProfileUi(network: StartedNetwork, keycloakContainer: OneCXKeycloakContainer) {
    const ui = new OneCXUserProfileUiContainer(containerImagesEnv.ONECX_USER_PROFILE_UI, {
      network,
      keycloakContainer
    })
    return this.addApp<OneCXUiContainer>(this.uis, ui)
  }

  protected setupIamBff(network: StartedNetwork, keycloakContainer: OneCXKeycloakContainer) {
    const bff = new OneCXIamBffContainer(containerImagesEnv.ONECX_IAM_BFF, {
      network,
      keycloakContainer
    })
    return this.addApp<OneCXBffContainer>(this.bffs, bff)
  }

  protected setupIamUi(network: StartedNetwork, keycloakContainer: OneCXKeycloakContainer) {
    const ui = new OneCXIamUiContainer(containerImagesEnv.ONECX_IAM_UI, {
      network,
      keycloakContainer
    })
    return this.addApp<OneCXUiContainer>(this.uis, ui)
  }

  protected setupWorkspaceBff(network: StartedNetwork, keycloakContainer: OneCXKeycloakContainer) {
    const bff = new OneCXWorkspaceBffContainer(containerImagesEnv.ONECX_WORKSPACE_BFF, {
      network,
      keycloakContainer
    })
    return this.addApp<OneCXBffContainer>(this.bffs, bff)
  }

  protected setupWorkspaceUi(network: StartedNetwork, keycloakContainer: OneCXKeycloakContainer) {
    const ui = new OneCXWorkspaceUiContainer(containerImagesEnv.ONECX_WORKSPACE_UI, {
      network,
      keycloakContainer
    })
    return this.addApp<OneCXUiContainer>(this.uis, ui)
  }
}

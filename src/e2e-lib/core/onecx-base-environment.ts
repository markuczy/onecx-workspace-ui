import { Network, StartedNetwork } from 'testcontainers'
import { OneCXPostgresContainer, StartedOneCXPostgresContainer } from './onecx-postgres'
import { containerImagesEnv } from '../constants/e2e-config'
import path from 'path'
import { OneCXKeycloakContainer, StartedOneCXKeycloakContainer } from './onecx-keycloak'
import { OneCXThemeSvcContainer } from '../apps/onecx-theme-svc'
import { OneCXPermissionSvcContainer } from '../apps/onecx-permission-svc'
import { OneCXProductStoreSvcContainer } from '../apps/onecx-product-store-svc'
import { OneCXUserProfileSvcContainer } from '../apps/onecx-user-profile-svc'
import { OneCXIamKcSvcContainer } from '../apps/onecx-iam-kc-svc'
import { OneCXTenantSvcContainer } from '../apps/onecx-tenant-svc'
import { OneCXWorkspaceSvcContainer } from '../apps/onecx-workspace-svc'
import { OneCXSvcContainer, StartedOneCXSvcContainer } from '../abstract/onecx-svc'
import { OneCXBffContainer, StartedOneCXBffContainer } from '../abstract/onecx-bff'
import { OneCXUiContainer, StartedOneCXUiContainer } from '../abstract/onecx-ui'
import { OneCXAppSet } from '../abstract/onecx-app-set'
import { importDatabaseData } from '../utils/utils'
import { OneCXShellBffContainer } from '../core/onecx-shell-bff'
import { OneCXShellUiContainer } from '../core/onecx-shell-ui'
import { ContainerStartError } from '../model/container-start-error'

export type CheckDatabaseFunc = (dbName: string, databaseContainer: StartedOneCXPostgresContainer) => Promise<boolean>

export class OneCXEnvironment {
  private network: StartedNetwork | undefined
  private database: OneCXPostgresContainer
  private startedDatabase: StartedOneCXPostgresContainer | undefined
  private keycloak: OneCXKeycloakContainer
  private startedKeycloak: StartedOneCXKeycloakContainer | undefined
  private services: OneCXAppSet<OneCXSvcContainer> = new OneCXAppSet()
  private startedServices: Array<StartedOneCXSvcContainer>
  private bffs: OneCXAppSet<OneCXBffContainer> = new OneCXAppSet()
  private startedBffs: Array<StartedOneCXBffContainer>
  private uis: OneCXAppSet<OneCXUiContainer> = new OneCXAppSet()
  private startedUis: Array<StartedOneCXUiContainer>

  private nameAndAliasPrefix: string | undefined

  private checkDatabases: boolean = true
  private checkDatabaseFunc: CheckDatabaseFunc = this.defaultCheckDatabaseFunc

  constructor() {}

  // TODO: Prefix only for name so container names don't clash
  public withOneCXNameAndAliasPrefix(prefix: string) {
    this.nameAndAliasPrefix = prefix
    return this
  }

  public withCheckDatabases(ifCheckDatabases: boolean) {
    this.checkDatabases = ifCheckDatabases
    return this
  }

  public withCheckDatabaseFunc(func: CheckDatabaseFunc) {
    this.checkDatabaseFunc = func
    return this
  }

  public withOneCXNetwork(network: StartedNetwork) {
    this.network = network
    return this
  }

  public withOneCXDatabase(database: OneCXPostgresContainer) {
    this.database = database
    return this
  }

  public withOneCXKeycloak(keycloak: OneCXKeycloakContainer) {
    this.keycloak = keycloak
    return this
  }

  public withOneCXService(svc: OneCXSvcContainer) {
    this.services.add(svc)
    return this
  }

  public withOneCXBff(bff: OneCXBffContainer) {
    this.bffs.add(bff)
    return this
  }

  public withOneCXUi(ui: OneCXUiContainer) {
    this.uis.add(ui)
    return this
  }

  public getOneCXNetwork() {
    return this.network
  }

  public getOneCXDatabase() {
    return this.startedDatabase
  }

  public getOneCXKeycloak() {
    return this.startedKeycloak
  }

  public getOneCXServices() {
    return this.services
  }

  public getOneCXBffs() {
    return this.bffs
  }

  public getOneCXUis() {
    return this.uis
  }

  public async startNetwork() {
    this.log('Starting network')
    this.network = this.network ?? (await new Network().start())
    if (!this.network) {
      throw new ContainerStartError('Could not start network.')
    }
    this.log('Network started')
    return this
  }

  public async startDatabase() {
    if (!this.network) {
      throw new ContainerStartError('Could not start database. Network has not been created.')
    }

    this.database = this.database ?? this.setupDatabase(this.network)
    this.startedDatabase = await this.database.start()
    if (!this.startedDatabase) {
      throw new ContainerStartError('Could not start database container.')
    }

    const databases = await this.startedDatabase.getOneCXDatabases()
    this.log(`Created databases ${databases}`)

    if (this.checkDatabases) {
      let allDatabasesExist = true
      for (const db of databases) {
        this.log(`Checking existence of ${db} database`)
        const dbExists = await this.checkDatabaseFunc(db, this.startedDatabase)
        if (dbExists) {
          this.log(`${db} database exists`)
        } else {
          this.error(`${db} does not exist`)
          allDatabasesExist = false
        }
      }
      if (!allDatabasesExist) {
        throw new ContainerStartError('Some databases were not created')
      }
    }

    return this
  }

  public async startKeycloak() {
    if (!this.network) {
      throw new ContainerStartError('Could not start keycloak. Network has not been created.')
    }
    if (!this.startedDatabase) {
      throw new ContainerStartError('Could not start keycloak. Database has not been created.')
    }
    this.keycloak = this.keycloak ?? this.setupKeycloak(this.network, this.startedDatabase)
    this.startedKeycloak = await this.keycloak.start()
    if (!this.startedKeycloak) {
      throw new ContainerStartError('Could not start keycloak.')
    }

    return this
  }

  public async startApplications(): Promise<OneCXEnvironment> {
    if (!this.network) {
      throw new ContainerStartError('Could not start core applications. Network has not been created.')
    }
    if (!this.startedDatabase) {
      throw new ContainerStartError('Could not start core applications. Database has not been created.')
    }
    if (!this.startedKeycloak) {
      throw new ContainerStartError('Could not start core applications. Keycloak has not been created.')
    }
    //--------SERVICE--------
    this.setupThemeSvc(this.network, this.startedDatabase, this.startedKeycloak)
    const tenantSvc = this.setupTenantSvc(this.network, this.startedDatabase, this.startedKeycloak)
    this.setupPermissionSvc(this.network, this.startedDatabase, this.startedKeycloak, tenantSvc)
    this.setupProductStoreSvc(this.network, this.startedDatabase, this.startedKeycloak)
    this.setupUserProfileSvc(this.network, this.startedDatabase, this.startedKeycloak)
    this.setupIamKcSvc(this.network, this.startedDatabase, this.startedKeycloak)
    this.setupWorkspaceSvc(this.network, this.startedDatabase, this.startedKeycloak)

    this.startedServices = await Promise.all([
      ...this.services.values().map((svc) =>
        svc.start().catch((error) => {
          throw new ContainerStartError(`Could not start ${svc.getOneCXAlias()}`, error)
        })
      )
    ])

    //--------IMPORT_DATA--------
    await this.importData()

    //--------BFF--------
    this.setupShellBff(this.network, this.startedKeycloak)

    this.startedBffs = await Promise.all([
      ...this.bffs.values().map((bff) =>
        bff.start().catch((error) => {
          throw new ContainerStartError(`Could not start ${bff.getOneCXAlias()}`, error)
        })
      )
    ])
    //--------UI--------
    this.setupShellUi(this.network, this.startedKeycloak)

    this.startedUis = await Promise.all([
      ...this.uis.values().map((ui) =>
        ui.start().catch((error) => {
          throw new ContainerStartError(`Could not start ${ui.getOneCXAlias()}`, error)
        })
      )
    ])

    return this
  }

  public getOneCXShellUi() {
    return this.startedUis.find((ui) => ui.getOneCXAppId() === 'shell-ui')
  }

  public getOneCXService(appId: string) {
    return this.services.values().find((svc) => svc.getOneCXAppDetails().appId === appId)
  }

  public getOneCXStartedService(appId: string) {
    return this.startedServices.find((svc) => svc.getOneCXAppId() === appId)
  }

  public getOneCXBff(appId: string) {
    return this.bffs.values().find((bff) => bff.getOneCXAppDetails().appId === appId)
  }

  public getOneCXStartedBff(appId: string) {
    return this.startedBffs.find((bff) => bff.getOneCXAppId() === appId)
  }

  public getOneCXUi(appId: string) {
    return this.uis.values().find((ui) => ui.getOneCXAppDetails().appId === appId)
  }

  public getOneCXStartedUi(appId: string) {
    return this.startedUis.find((ui) => ui.getOneCXAppId() === appId)
  }

  public async teardown() {
    this.log('Starting teardown')

    this.startedDatabase && (await this.startedDatabase.stop())
    this.log(`${this.database.getOneCXAlias()} stopped`)

    this.startedKeycloak && (await this.startedKeycloak.stop())
    this.log(`${this.keycloak.getOneCXAlias()} stopped`)

    await Promise.all([
      ...this.startedServices.map((svc) => {
        return svc.stop().then(() => this.log(`${svc.getOneCXAlias()} stopped`))
      }),
      ...this.startedBffs.map((bff) => {
        return bff.stop().then(() => this.log(`${bff.getOneCXAlias()} stopped`))
      }),
      ...this.startedUis.map((ui) => {
        return ui.stop().then(() => this.log(`${ui.getOneCXAlias()} stopped`))
      })
    ]).then(() => {
      this.log('All applications stopped')
    })

    this.network && (await this.network.stop())
    this.log(`Network stopped`)

    this.log('Finished teardown')
  }

  // TODO: There should be default db data and path to it
  // TODO: Handle failed import
  public async importData() {
    await importDatabaseData(
      {
        THEME_SVC_PORT: this.getOneCXStartedService('theme-svc')?.getMappedPort(8080) ?? -1,
        PERMISSION_SVC_PORT: this.getOneCXStartedService('permission-svc')?.getMappedPort(8080) ?? -1,
        PRODUCT_STORE_SVC_PORT: this.getOneCXStartedService('product-store-svc')?.getMappedPort(8080) ?? -1,
        USER_PROFILE_SVC_PORT: this.getOneCXStartedService('user-profile-svc')?.getMappedPort(8080) ?? -1,
        IAM_KC_SVC_PORT: this.getOneCXStartedService('iam-kc-svc')?.getMappedPort(8080) ?? -1,
        TENANT_SVC_PORT: this.getOneCXStartedService('tenant-svc')?.getMappedPort(8080) ?? -1,
        WORKSPACE_SVC_PORT: this.getOneCXStartedService('workspace-svc')?.getMappedPort(8080) ?? -1
      },
      path.resolve('e2e-tests/import-onecx.sh')
    )
  }

  protected log(message: string) {
    console.log(`OneCXBaseEnvironment: ${message}`)
  }

  protected error(message: string) {
    console.error(`OneCXBaseEnvironment: ${message}`)
  }

  // TODO: Image overwrite
  // TODO: For existing SVC prior to returning set the nameAndAliasPrefix
  private setupThemeSvc(
    network: StartedNetwork,
    databaseContainer: StartedOneCXPostgresContainer,
    keycloakContainer: StartedOneCXKeycloakContainer
  ) {
    const themeSvc = new OneCXThemeSvcContainer(containerImagesEnv.ONECX_THEME_SVC, {
      network,
      databaseContainer,
      keycloakContainer
    })
    const existingThemeSvc = this.services.get(themeSvc)
    if (existingThemeSvc) return existingThemeSvc

    !this.services.has(themeSvc) && this.services.add(themeSvc)
    this.nameAndAliasPrefix &&
      themeSvc.withOneCXNameAndAlias(this.nameAndAliasPrefix.concat(themeSvc.getOneCXNameAndAlias()))
    return themeSvc
  }

  // TODO: Image overwrite
  private setupTenantSvc(
    network: StartedNetwork,
    databaseContainer: StartedOneCXPostgresContainer,
    keycloakContainer: StartedOneCXKeycloakContainer
  ) {
    const tenantSvc = new OneCXTenantSvcContainer(containerImagesEnv.ONECX_TENANT_SVC, {
      network,
      databaseContainer,
      keycloakContainer
    })
    const existingTenantSvc = this.services.get(tenantSvc)
    if (existingTenantSvc) return existingTenantSvc

    this.services.add(tenantSvc)
    this.nameAndAliasPrefix &&
      tenantSvc.withOneCXNameAndAlias(this.nameAndAliasPrefix.concat(tenantSvc.getOneCXNameAndAlias()))
    return tenantSvc
  }

  // TODO: Image overwrite
  private setupPermissionSvc(
    network: StartedNetwork,
    databaseContainer: StartedOneCXPostgresContainer,
    keycloakContainer: StartedOneCXKeycloakContainer,
    tenantContainer: OneCXTenantSvcContainer
  ) {
    const permissionSvc = new OneCXPermissionSvcContainer(containerImagesEnv.ONECX_PERMISSION_SVC, {
      network,
      databaseContainer,
      keycloakContainer,
      tenantContainer
    })
    const existingPermissionSvc = this.services.get(permissionSvc)
    if (existingPermissionSvc) return existingPermissionSvc

    !this.services.has(permissionSvc) && this.services.add(permissionSvc)
    this.nameAndAliasPrefix &&
      permissionSvc.withOneCXNameAndAlias(this.nameAndAliasPrefix.concat(permissionSvc.getOneCXNameAndAlias()))
    return permissionSvc
  }

  // TODO: Image overwrite
  private setupProductStoreSvc(
    network: StartedNetwork,
    databaseContainer: StartedOneCXPostgresContainer,
    keycloakContainer: StartedOneCXKeycloakContainer
  ) {
    const productStoreSvc = new OneCXProductStoreSvcContainer(containerImagesEnv.ONECX_PRODUCT_STORE_SVC, {
      network,
      databaseContainer,
      keycloakContainer
    })
    const existingProductStoreSvc = this.services.get(productStoreSvc)
    if (existingProductStoreSvc) return existingProductStoreSvc

    !this.services.has(productStoreSvc) && this.services.add(productStoreSvc)
    this.nameAndAliasPrefix &&
      productStoreSvc.withOneCXNameAndAlias(this.nameAndAliasPrefix.concat(productStoreSvc.getOneCXNameAndAlias()))
    return productStoreSvc
  }

  // TODO: Image overwrite
  private setupUserProfileSvc(
    network: StartedNetwork,
    databaseContainer: StartedOneCXPostgresContainer,
    keycloakContainer: StartedOneCXKeycloakContainer
  ) {
    const userProfileSvc = new OneCXUserProfileSvcContainer(containerImagesEnv.ONECX_USER_PROFILE_SVC, {
      network,
      databaseContainer,
      keycloakContainer
    })
    const existingUserProfileSvc = this.services.get(userProfileSvc)
    if (existingUserProfileSvc) return existingUserProfileSvc

    !this.services.has(userProfileSvc) && this.services.add(userProfileSvc)
    this.nameAndAliasPrefix &&
      userProfileSvc.withOneCXNameAndAlias(this.nameAndAliasPrefix.concat(userProfileSvc.getOneCXNameAndAlias()))
    return userProfileSvc
  }

  // TODO: Image overwrite
  private setupIamKcSvc(
    network: StartedNetwork,
    databaseContainer: StartedOneCXPostgresContainer,
    keycloakContainer: StartedOneCXKeycloakContainer
  ) {
    const iamKcSvc = new OneCXIamKcSvcContainer(containerImagesEnv.ONECX_IAM_KC_SVC, {
      network,
      databaseContainer,
      keycloakContainer
    })
    const existingIamKcSvc = this.services.get(iamKcSvc)
    if (existingIamKcSvc) return existingIamKcSvc

    !this.services.has(iamKcSvc) && this.services.add(iamKcSvc)
    this.nameAndAliasPrefix &&
      iamKcSvc.withOneCXNameAndAlias(this.nameAndAliasPrefix.concat(iamKcSvc.getOneCXNameAndAlias()))
    return iamKcSvc
  }

  // TODO: Image overwrite
  private setupWorkspaceSvc(
    network: StartedNetwork,
    databaseContainer: StartedOneCXPostgresContainer,
    keycloakContainer: StartedOneCXKeycloakContainer
  ) {
    const workspaceSvc = new OneCXWorkspaceSvcContainer(containerImagesEnv.ONECX_WORKSPACE_SVC, {
      network,
      databaseContainer,
      keycloakContainer
    })
    const existingWorkspaceSvc = this.services.get(workspaceSvc)
    if (existingWorkspaceSvc) return existingWorkspaceSvc

    !this.services.has(workspaceSvc) && this.services.add(workspaceSvc)
    this.nameAndAliasPrefix &&
      workspaceSvc.withOneCXNameAndAlias(this.nameAndAliasPrefix.concat(workspaceSvc.getOneCXNameAndAlias()))
    return workspaceSvc
  }

  // TODO: Image overwrite
  private setupShellBff(network: StartedNetwork, keycloakContainer: StartedOneCXKeycloakContainer) {
    const shellBff = new OneCXShellBffContainer(containerImagesEnv.ONECX_SHELL_BFF, { network, keycloakContainer })
    const existingShellBff = this.bffs.get(shellBff)
    if (existingShellBff) return existingShellBff

    !this.bffs.has(shellBff) && this.bffs.add(shellBff)
    this.nameAndAliasPrefix &&
      shellBff.withOneCXNameAndAlias(this.nameAndAliasPrefix.concat(shellBff.getOneCXNameAndAlias()))
    return shellBff
  }

  // TODO: Image overwrite
  private setupShellUi(network: StartedNetwork, keycloakContainer: StartedOneCXKeycloakContainer) {
    const shellUi = new OneCXShellUiContainer(containerImagesEnv.ONECX_SHELL_UI, { network, keycloakContainer })
    const existingShellUi = this.uis.get(shellUi)
    if (existingShellUi) return existingShellUi

    !this.uis.has(shellUi) && this.uis.add(shellUi)
    this.nameAndAliasPrefix &&
      shellUi.withOneCXNameAndAlias(this.nameAndAliasPrefix.concat(shellUi.getOneCXNameAndAlias()))
    return shellUi
  }

  // TODO: There should be default db data and path to it
  // TODO: Image overwrite
  private setupDatabase(network: StartedNetwork) {
    const db = new OneCXPostgresContainer(containerImagesEnv.POSTGRES, network, path.resolve('e2e-tests/init-data/db'))
    this.nameAndAliasPrefix && db.withOneCXNameAndAlias(this.nameAndAliasPrefix.concat(db.getOneCXNameAndAlias()))
    return db
  }

  // TODO: There should be default db data and path to it
  // TODO: Image overwrite
  private setupKeycloak(network: StartedNetwork, databaseContainer: StartedOneCXPostgresContainer) {
    const keycloak = new OneCXKeycloakContainer(
      containerImagesEnv.KEYCLOAK,
      network,
      databaseContainer,
      path.resolve('e2e-tests/init-data/keycloak/imports')
    )
    this.nameAndAliasPrefix &&
      keycloak.withOneCXNameAndAlias(this.nameAndAliasPrefix.concat(keycloak.getOneCXNameAndAlias()))

    return keycloak
  }

  private async defaultCheckDatabaseFunc(dbName: string, databaseContainer: StartedOneCXPostgresContainer) {
    return await databaseContainer.doesDatabaseExist(dbName, dbName)
  }
}

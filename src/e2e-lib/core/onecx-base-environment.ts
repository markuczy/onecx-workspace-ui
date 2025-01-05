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
import { IOneCXContainer, OneCXContainer } from '../abstract/onecx-container'
import { OneCXAppContainer } from '../abstract/onecx-app'

export type CheckDatabaseFunc = (dbName: string, databaseContainer: StartedOneCXPostgresContainer) => Promise<boolean>

export interface OneCXEnvironmentStartParams {
  importData?: boolean
}

export class OneCXEnvironment {
  private network: StartedNetwork
  private database: OneCXPostgresContainer
  private startedDatabase: StartedOneCXPostgresContainer | undefined
  private keycloak: OneCXKeycloakContainer
  private startedKeycloak: StartedOneCXKeycloakContainer | undefined
  private services: OneCXAppSet<OneCXSvcContainer> = new OneCXAppSet()
  private startedServices: Array<StartedOneCXSvcContainer> = []
  private bffs: OneCXAppSet<OneCXBffContainer> = new OneCXAppSet()
  private startedBffs: Array<StartedOneCXBffContainer> = []
  private uis: OneCXAppSet<OneCXUiContainer> = new OneCXAppSet()
  private startedUis: Array<StartedOneCXUiContainer> = []

  private namePrefix: string | undefined

  private checkDatabases: boolean = true
  private checkDatabaseFunc: CheckDatabaseFunc = this.defaultCheckDatabaseFunc

  constructor(network: StartedNetwork) {
    this.network = network
    this.database = this.setupDatabase(this.network)
    this.keycloak = this.setupKeycloak(this.network, this.database)
  }

  public withOneCXNamePrefix(prefix: string) {
    this.namePrefix = prefix
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

  public withOneCXDatabase(database: OneCXPostgresContainer) {
    this.database = database
    return this
  }

  public withOneCXKeycloak(keycloak: OneCXKeycloakContainer) {
    this.keycloak = keycloak
    return this
  }

  public withOneCXService(svc: OneCXSvcContainer) {
    this.addApp<OneCXSvcContainer>(this.services, svc)
    return this
  }

  public withOneCXBff(bff: OneCXBffContainer) {
    this.addApp<OneCXBffContainer>(this.bffs, bff)
    return this
  }

  public withOneCXUi(ui: OneCXUiContainer) {
    this.addApp<OneCXUiContainer>(this.uis, ui)
    return this
  }

  public getOneCXNetwork() {
    return this.network
  }

  public getOneCXDatabase() {
    return this.database
  }

  public getOneCXStartedDatabase() {
    return this.startedDatabase
  }

  public getOneCXKeycloak() {
    return this.keycloak
  }

  public getOneCXStartedKeycloak() {
    return this.startedKeycloak
  }

  public getOneCXServices() {
    return this.services
  }

  public getOneCXStartedServices() {
    return this.startedServices
  }

  public getOneCXBffs() {
    return this.bffs
  }

  public getOneCXStartedBffs() {
    return this.startedBffs
  }

  public getOneCXUis() {
    return this.uis
  }

  public getOneCXStartedUis() {
    return this.startedUis
  }

  public getOneCXService(appId: string) {
    return this.services.values().find((svc) => svc.getOneCXAppId() === appId)
  }

  public getOneCXStartedService(appId: string) {
    return this.startedServices.find((svc) => svc.getOneCXAppId() === appId)
  }

  public getOneCXBff(appId: string) {
    return this.bffs.values().find((bff) => bff.getOneCXAppId() === appId)
  }

  public getOneCXStartedBff(appId: string) {
    return this.startedBffs.find((bff) => bff.getOneCXAppId() === appId)
  }

  public getOneCXUi(appId: string) {
    return this.uis.values().find((ui) => ui.getOneCXAppId() === appId)
  }

  public getOneCXStartedUi(appId: string) {
    return this.startedUis.find((ui) => ui.getOneCXAppId() === appId)
  }

  public getOneCXShellUi() {
    return this.startedUis.find((ui) => ui.getOneCXAppId() === 'shell-ui')
  }

  public async start(params: OneCXEnvironmentStartParams) {
    await this.startDatabase()
    await this.startKeycloak()
    await this.startApplications()

    params.importData && this.importData()
    return this
  }

  public async startDatabase() {
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
    if (!this.startedDatabase) {
      throw new ContainerStartError('Could not start keycloak. Database has not been created.')
    }

    this.startedKeycloak = await this.keycloak.start()
    if (!this.startedKeycloak) {
      throw new ContainerStartError('Could not start keycloak.')
    }

    return this
  }

  public async startApplications(): Promise<OneCXEnvironment> {
    if (!this.startedDatabase) {
      throw new ContainerStartError('Could not start applications. Database has not been created.')
    }
    if (!this.startedKeycloak) {
      throw new ContainerStartError('Could not start applications. Keycloak has not been created.')
    }
    //--------SETUP-SERVICE--------
    this.setupThemeSvc(this.network, this.startedDatabase, this.startedKeycloak)
    const tenantSvc = this.setupTenantSvc(this.network, this.startedDatabase, this.startedKeycloak)
    this.setupPermissionSvc(this.network, this.startedDatabase, this.startedKeycloak, tenantSvc)
    this.setupProductStoreSvc(this.network, this.startedDatabase, this.startedKeycloak)
    this.setupUserProfileSvc(this.network, this.startedDatabase, this.startedKeycloak)
    this.setupIamKcSvc(this.network, this.startedDatabase, this.startedKeycloak)
    this.setupWorkspaceSvc(this.network, this.startedDatabase, this.startedKeycloak)

    //--------SETUP-BFF--------
    this.setupShellBff(this.network, this.startedKeycloak)

    //--------SETUP-UI--------
    this.setupShellUi(this.network, this.startedKeycloak)

    this.startedServices = await Promise.all([
      ...this.services.values().map((svc) =>
        svc.start().catch((error) => {
          throw new ContainerStartError(`Could not start ${svc.getOneCXAlias()}`, error)
        })
      )
    ])

    this.startedBffs = await Promise.all([
      ...this.bffs.values().map((bff) =>
        bff.start().catch((error) => {
          throw new ContainerStartError(`Could not start ${bff.getOneCXAlias()}`, error)
        })
      )
    ])

    this.startedUis = await Promise.all([
      ...this.uis.values().map((ui) =>
        ui.start().catch((error) => {
          throw new ContainerStartError(`Could not start ${ui.getOneCXAlias()}`, error)
        })
      )
    ])

    return this
  }

  public async teardown() {
    this.log('Starting teardown')

    this.startedDatabase && (await this.startedDatabase.stop())
    this.startedDatabase && this.log(`${this.startedDatabase.getOneCXAlias()} stopped`)

    this.startedKeycloak && (await this.startedKeycloak.stop())
    this.startedKeycloak && this.log(`${this.startedKeycloak.getOneCXAlias()} stopped`)

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

  private log(message: string) {
    console.log(`OneCXBaseEnvironment: ${message}`)
  }

  private error(message: string) {
    console.error(`OneCXBaseEnvironment: ${message}`)
  }

  private setupThemeSvc(
    network: StartedNetwork,
    databaseContainer: StartedOneCXPostgresContainer,
    keycloakContainer: StartedOneCXKeycloakContainer
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
    databaseContainer: StartedOneCXPostgresContainer,
    keycloakContainer: StartedOneCXKeycloakContainer
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
    return this.addApp<OneCXSvcContainer>(this.services, permissionSvc)
  }

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
    return this.addApp<OneCXSvcContainer>(this.services, productStoreSvc)
  }

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
    return this.addApp<OneCXSvcContainer>(this.services, userProfileSvc)
  }

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
    return this.addApp<OneCXSvcContainer>(this.services, iamKcSvc)
  }

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
    return this.addApp<OneCXSvcContainer>(this.services, workspaceSvc)
  }

  private setupShellBff(network: StartedNetwork, keycloakContainer: StartedOneCXKeycloakContainer) {
    const shellBff = new OneCXShellBffContainer(containerImagesEnv.ONECX_SHELL_BFF, { network, keycloakContainer })
    return this.addApp<OneCXBffContainer>(this.bffs, shellBff)
  }

  private setupShellUi(network: StartedNetwork, keycloakContainer: StartedOneCXKeycloakContainer) {
    const shellUi = new OneCXShellUiContainer(containerImagesEnv.ONECX_SHELL_UI, { network, keycloakContainer })
    return this.addApp<OneCXUiContainer>(this.uis, shellUi)
  }

  // TODO: There should be default db data and path to it
  private setupDatabase(network: StartedNetwork) {
    const db = new OneCXPostgresContainer(containerImagesEnv.POSTGRES, network, path.resolve('e2e-tests/init-data/db'))

    return this.prefixedContainer(db)
  }

  // TODO: There should be default db data and path to it
  private setupKeycloak(network: StartedNetwork, databaseContainer: IOneCXContainer) {
    const keycloak = new OneCXKeycloakContainer(
      containerImagesEnv.KEYCLOAK,
      network,
      databaseContainer,
      path.resolve('e2e-tests/init-data/keycloak/imports')
    )

    return this.prefixedContainer(keycloak)
  }

  private addApp<T extends OneCXAppContainer>(set: OneCXAppSet<T>, container: T) {
    const existingApp = set.get(container)
    if (existingApp) return this.prefixedContainer(existingApp)

    set.add(container)
    return this.prefixedContainer(container)
  }

  private prefixedContainer<T extends OneCXContainer>(container: T) {
    if (this.namePrefix && container.getOneCXName().startsWith(this.namePrefix)) return container

    this.namePrefix && container.withOneCXName(this.namePrefix.concat(container.getOneCXName()))
    return container
  }

  private async defaultCheckDatabaseFunc(dbName: string, databaseContainer: StartedOneCXPostgresContainer) {
    return await databaseContainer.doesDatabaseExist(dbName, dbName)
  }
}

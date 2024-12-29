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

export interface OneCXBaseConfig {
  checkDatabases?: boolean
  checkDatabaseFunc?: (dbName: string, databaseContainer: StartedOneCXPostgresContainer) => Promise<boolean>
}

export class OneCXBaseEnvironment {
  protected network: StartedNetwork | undefined
  protected database: OneCXPostgresContainer
  protected keycloak: OneCXKeycloakContainer
  protected services: OneCXAppSet<OneCXSvcContainer> = new OneCXAppSet()
  protected startedServices: Array<StartedOneCXSvcContainer>
  protected bffs: OneCXAppSet<OneCXBffContainer> = new OneCXAppSet()
  protected startedBffs: Array<StartedOneCXBffContainer>
  protected uis: OneCXAppSet<OneCXUiContainer> = new OneCXAppSet()
  protected startedUis: Array<StartedOneCXUiContainer>

  private checkDatabases: boolean = true
  private checkDatabaseFunc: (dbName: string, databaseContainer: StartedOneCXPostgresContainer) => Promise<boolean>
  constructor(private readonly config: OneCXBaseConfig) {
    this.checkDatabases = config.checkDatabases ?? this.checkDatabases
    this.checkDatabaseFunc = config.checkDatabaseFunc ?? this.defaultCheckDatabaseFunc
  }

  public withOneCXNetwork(network: StartedNetwork) {
    this.network = network
    return this
  }

  public withOneCXDatabase(database: OneCXPostgresContainer) {
    this.database = database
    return this
  }

  public withOneCXKeycloak(database: OneCXPostgresContainer) {
    this.database = database
    return this
  }

  public withOneCXService(service: OneCXSvcContainer) {
    this.services.add(service)
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

  public withOneCXThemeSvc(themeSvc: OneCXThemeSvcContainer) {
    this.services.add(themeSvc)
  }

  public withOneCXPermissionSvc(permissionSvc: OneCXPermissionSvcContainer) {
    this.services.add(permissionSvc)
  }

  public withOneCXProductStoreSvc(productStoreSvc: OneCXProductStoreSvcContainer) {
    this.services.add(productStoreSvc)
  }

  public withOneCXUserProfileSvc(userProfileSvc: OneCXUserProfileSvcContainer) {
    this.services.add(userProfileSvc)
  }

  public withOneCXIamKcSvc(iamKcSvc: OneCXIamKcSvcContainer) {
    this.services.add(iamKcSvc)
  }

  public withOneCXTenantSvc(tenantSvc: OneCXTenantSvcContainer) {
    this.services.add(tenantSvc)
  }

  public withOneCXWorkspaceSvc(workspaceSvc: OneCXWorkspaceSvcContainer) {
    this.services.add(workspaceSvc)
  }
  public getOneCXNetwork() {
    return this.network
  }

  public async start(): Promise<StartedOneCXBaseEnvironment> {
    //--------NETWORK--------
    this.log('Starting network')
    this.network = this.network ?? (await new Network().start())
    if (!this.network) {
      throw new ContainerStartError('Could not start network')
    }
    this.log('Network started')

    //--------DATABASE--------
    this.database = this.database ?? (await this.setupDatabase(this.network))
    const startedDatabase = await this.database.start()
    if (!startedDatabase) {
      throw new ContainerStartError('Could not start database')
    }

    const databases = await startedDatabase.getOneCXDatabases()
    this.log(`Created databases ${databases}`)

    if (this.checkDatabases) {
      let allDatabasesExist = true
      for (const db of databases) {
        this.log(`Checking existence of ${db} database`)
        const dbExists = await this.checkDatabaseFunc(db, startedDatabase)
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

    //--------KEYCLOAK--------
    this.keycloak = this.keycloak ?? (await this.setupKeycloak(this.network, startedDatabase))
    const startedKeycloak = await this.keycloak.start()
    if (!startedKeycloak) {
      throw new ContainerStartError('Could not start keycloak')
    }

    //--------SERVICE--------
    this.setupThemeSvc(this.network, startedDatabase, startedKeycloak)
    const tenantSvc = this.setupTenantSvc(this.network, startedDatabase, startedKeycloak)
    this.setupPermissionSvc(this.network, startedDatabase, startedKeycloak, tenantSvc)
    this.setupProductStoreSvc(this.network, startedDatabase, startedKeycloak)
    this.setupUserProfileSvc(this.network, startedDatabase, startedKeycloak)
    this.setupIamKcSvc(this.network, startedDatabase, startedKeycloak)
    this.setupWorkspaceSvc(this.network, startedDatabase, startedKeycloak)

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
    this.setupShellBff(this.network)

    this.startedBffs = await Promise.all([
      ...this.bffs.values().map((bff) =>
        bff.start().catch((error) => {
          throw new ContainerStartError(`Could not start ${bff.getOneCXAlias()}`, error)
        })
      )
    ])
    //--------UI--------
    this.setupShellUi(this.network, startedKeycloak)

    this.startedUis = await Promise.all([
      ...this.uis.values().map((ui) =>
        ui.start().catch((error) => {
          throw new ContainerStartError(`Could not start ${ui.getOneCXAlias()}`, error)
        })
      )
    ])

    return new StartedOneCXBaseEnvironment(
      this.network,
      startedDatabase,
      startedKeycloak,
      this.startedServices,
      this.startedBffs,
      this.startedUis
    )
  }

  // TODO: Image overwrite
  protected setupThemeSvc(
    network: StartedNetwork,
    databaseContainer: StartedOneCXPostgresContainer,
    keycloakContainer: StartedOneCXKeycloakContainer
  ) {
    const themeSvc = new OneCXThemeSvcContainer(
      containerImagesEnv.ONECX_THEME_SVC,
      network,
      databaseContainer,
      keycloakContainer
    )

    !this.services.has(themeSvc) && this.services.add(themeSvc)
    return themeSvc
  }

  // TODO: Image overwrite
  protected setupTenantSvc(
    network: StartedNetwork,
    databaseContainer: StartedOneCXPostgresContainer,
    keycloakContainer: StartedOneCXKeycloakContainer
  ) {
    const tenantSvc = new OneCXTenantSvcContainer(
      containerImagesEnv.ONECX_TENANT_SVC,
      network,
      databaseContainer,
      keycloakContainer
    )

    !this.services.has(tenantSvc) && this.services.add(tenantSvc)
    return tenantSvc
  }

  // TODO: Image overwrite
  protected setupPermissionSvc(
    network: StartedNetwork,
    databaseContainer: StartedOneCXPostgresContainer,
    keycloakContainer: StartedOneCXKeycloakContainer,
    tenantContainer: OneCXTenantSvcContainer
  ) {
    const permissionSvc = new OneCXPermissionSvcContainer(
      containerImagesEnv.ONECX_PERMISSION_SVC,
      network,
      databaseContainer,
      keycloakContainer,
      tenantContainer
    )

    !this.services.has(permissionSvc) && this.services.add(permissionSvc)
    return permissionSvc
  }

  // TODO: Image overwrite
  protected setupProductStoreSvc(
    network: StartedNetwork,
    databaseContainer: StartedOneCXPostgresContainer,
    keycloakContainer: StartedOneCXKeycloakContainer
  ) {
    const productStoreSvc = new OneCXProductStoreSvcContainer(
      containerImagesEnv.ONECX_PRODUCT_STORE_SVC,
      network,
      databaseContainer,
      keycloakContainer
    )

    !this.services.has(productStoreSvc) && this.services.add(productStoreSvc)
    return productStoreSvc
  }

  // TODO: Image overwrite
  protected setupUserProfileSvc(
    network: StartedNetwork,
    databaseContainer: StartedOneCXPostgresContainer,
    keycloakContainer: StartedOneCXKeycloakContainer
  ) {
    const userProfileSvc = new OneCXUserProfileSvcContainer(
      containerImagesEnv.ONECX_USER_PROFILE_SVC,
      network,
      databaseContainer,
      keycloakContainer
    )

    !this.services.has(userProfileSvc) && this.services.add(userProfileSvc)
    return userProfileSvc
  }

  // TODO: Image overwrite
  protected setupIamKcSvc(
    network: StartedNetwork,
    databaseContainer: StartedOneCXPostgresContainer,
    keycloakContainer: StartedOneCXKeycloakContainer
  ) {
    const iamKcSvc = new OneCXIamKcSvcContainer(
      containerImagesEnv.ONECX_IAM_KC_SVC,
      network,
      databaseContainer,
      keycloakContainer
    )

    !this.services.has(iamKcSvc) && this.services.add(iamKcSvc)
    return iamKcSvc
  }

  // TODO: Image overwrite
  protected setupWorkspaceSvc(
    network: StartedNetwork,
    databaseContainer: StartedOneCXPostgresContainer,
    keycloakContainer: StartedOneCXKeycloakContainer
  ) {
    const workspaceSvc = new OneCXWorkspaceSvcContainer(
      containerImagesEnv.ONECX_WORKSPACE_SVC,
      network,
      databaseContainer,
      keycloakContainer
    )

    !this.services.has(workspaceSvc) && this.services.add(workspaceSvc)
    return workspaceSvc
  }

  // TODO: Image overwrite
  protected setupShellBff(network: StartedNetwork) {
    const shellBff = new OneCXShellBffContainer(containerImagesEnv.ONECX_SHELL_BFF, network)

    !this.bffs.has(shellBff) && this.bffs.add(shellBff)
    return shellBff
  }

  // TODO: Image overwrite
  protected setupShellUi(network: StartedNetwork, keycloakContainer: StartedOneCXKeycloakContainer) {
    const shellUi = new OneCXShellUiContainer(containerImagesEnv.ONECX_SHELL_UI, network, keycloakContainer)

    !this.uis.has(shellUi) && this.uis.add(shellUi)
    return shellUi
  }

  // TODO: There should be default db data and path to it
  // TODO: Image overwrite
  protected async setupDatabase(network: StartedNetwork) {
    return await new OneCXPostgresContainer(
      containerImagesEnv.POSTGRES,
      network,
      path.resolve('e2e-tests/init-data/db')
    )
  }

  // TODO: There should be default db data and path to it
  // TODO: Image overwrite
  protected async setupKeycloak(network: StartedNetwork, databaseContainer: StartedOneCXPostgresContainer) {
    return await new OneCXKeycloakContainer(
      containerImagesEnv.KEYCLOAK,
      network,
      databaseContainer,
      path.resolve('e2e-tests/init-data/keycloak/imports')
    )
  }

  // TODO: There should be default db data and path to it
  // TODO: Handle failed import
  protected async importData() {
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

  protected getOneCXStartedService(appId: string) {
    const service = this.startedServices.find((svc) => svc.getOneCXAppId() === appId)
    !service && this.error(`Service with appId: ${appId} has not been started.`)
    return service
  }

  protected log(message: string) {
    console.log(`OneCXBaseEnvironment: ${message}`)
  }

  protected error(message: string) {
    console.error(`OneCXBaseEnvironment: ${message}`)
  }

  protected async defaultCheckDatabaseFunc(dbName: string, databaseContainer: StartedOneCXPostgresContainer) {
    return await databaseContainer.doesDatabaseExist(dbName, dbName)
  }
}

export class StartedOneCXBaseEnvironment {
  constructor(
    private network: StartedNetwork,
    private database: StartedOneCXPostgresContainer,
    private keycloak: StartedOneCXKeycloakContainer,
    private services: Array<StartedOneCXSvcContainer>,
    private bffs: Array<StartedOneCXBffContainer>,
    private uis: Array<StartedOneCXUiContainer>
  ) {}

  public getOneCXNetwork() {
    return this.network
  }

  public getOneCXDatabase() {
    return this.database
  }

  public getOneCXKeycloak() {
    return this.keycloak
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

  public getOneCXShellUi() {
    return this.uis.find((ui) => ui.getOneCXAppId() === 'shell-ui')
  }

  public async teardown() {
    this.log('Starting teardown')

    await this.database.stop()
    this.log(`${this.database.getOneCXAlias()} stopped`)

    await this.keycloak.stop()
    this.log(`${this.keycloak.getOneCXAlias()} stopped`)

    await Promise.all([
      ...this.services.map((svc) => {
        return svc.stop().then(() => this.log(`${svc.getOneCXAlias()} stopped`))
      }),
      ...this.bffs.map((bff) => {
        return bff.stop().then(() => this.log(`${bff.getOneCXAlias()} stopped`))
      }),
      ...this.uis.map((ui) => {
        return ui.stop().then(() => this.log(`${ui.getOneCXAlias()} stopped`))
      })
    ]).then(() => {
      this.log('All applications stopped')
    })

    await this.network.stop()
    this.log(`Network stopped`)

    this.log('Finished teardown')
  }

  private log(message: string) {
    console.log(`StartedOneCXBaseEnvironment: ${message}`)
  }

  private error(message: string) {
    console.error(`StartedOneCXBaseEnvironment: ${message}`)
  }
}

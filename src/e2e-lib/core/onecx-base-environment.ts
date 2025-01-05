import { StartedNetwork } from 'testcontainers'
import { OneCXPostgresContainer, StartedOneCXPostgresContainer } from './onecx-postgres'
import path from 'path'
import { OneCXKeycloakContainer, StartedOneCXKeycloakContainer } from './onecx-keycloak'
import { OneCXSvcContainer, StartedOneCXSvcContainer } from '../abstract/onecx-svc'
import { OneCXBffContainer, StartedOneCXBffContainer } from '../abstract/onecx-bff'
import { OneCXUiContainer, StartedOneCXUiContainer } from '../abstract/onecx-ui'
import { importDatabaseData } from '../utils/utils'
import { ContainerStartError } from '../model/container-start-error'
import { OneCXSetup } from './onecx-setup'

export type CheckDatabaseFunc = (dbName: string, databaseContainer: StartedOneCXPostgresContainer) => Promise<boolean>

export interface OneCXEnvironmentStartParams {
  importData?: boolean
}

export class OneCXEnvironment {
  private startedDatabase: StartedOneCXPostgresContainer | undefined
  private startedKeycloak: StartedOneCXKeycloakContainer | undefined
  private startedServices: Array<StartedOneCXSvcContainer> = []
  private startedBffs: Array<StartedOneCXBffContainer> = []
  private startedUis: Array<StartedOneCXUiContainer> = []

  private checkDatabases: boolean = true
  private checkDatabaseFunc: CheckDatabaseFunc = this.defaultCheckDatabaseFunc

  constructor(
    private readonly network: StartedNetwork,
    private readonly setup: OneCXSetup
  ) {}

  public withCheckDatabases(ifCheckDatabases: boolean) {
    this.checkDatabases = ifCheckDatabases
    return this
  }

  public withCheckDatabaseFunc(func: CheckDatabaseFunc) {
    this.checkDatabaseFunc = func
    return this
  }

  public withOneCXDatabase(database: OneCXPostgresContainer) {
    this.setup.database = database
    return this
  }

  public withOneCXKeycloak(keycloak: OneCXKeycloakContainer) {
    this.setup.keycloak = keycloak
    return this
  }

  public withOneCXService(svc: OneCXSvcContainer) {
    this.setup.withApp('SVC', svc)
    return this
  }

  public withOneCXBff(bff: OneCXBffContainer) {
    this.setup.withApp('BFF', bff)
    return this
  }

  public withOneCXUi(ui: OneCXUiContainer) {
    this.setup.withApp('UI', ui)
    return this
  }

  public getOneCXNetwork() {
    return this.network
  }

  public getOneCXDatabase() {
    return this.setup.database
  }

  public getOneCXStartedDatabase() {
    return this.startedDatabase
  }

  public getOneCXKeycloak() {
    return this.setup.keycloak
  }

  public getOneCXStartedKeycloak() {
    return this.startedKeycloak
  }

  public getOneCXServices() {
    return this.setup.services
  }

  public getOneCXStartedServices() {
    return this.startedServices
  }

  public getOneCXBffs() {
    return this.setup.bffs
  }

  public getOneCXStartedBffs() {
    return this.startedBffs
  }

  public getOneCXUis() {
    return this.setup.uis
  }

  public getOneCXStartedUis() {
    return this.startedUis
  }

  public getOneCXService(appId: string) {
    return this.setup.services.values().find((svc) => svc.getOneCXAppId() === appId)
  }

  public getOneCXStartedService(appId: string) {
    return this.startedServices.find((svc) => svc.getOneCXAppId() === appId)
  }

  public getOneCXBff(appId: string) {
    return this.setup.bffs.values().find((bff) => bff.getOneCXAppId() === appId)
  }

  public getOneCXStartedBff(appId: string) {
    return this.startedBffs.find((bff) => bff.getOneCXAppId() === appId)
  }

  public getOneCXUi(appId: string) {
    return this.setup.uis.values().find((ui) => ui.getOneCXAppId() === appId)
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
    this.startedDatabase = await this.setup.database.start()
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

    this.startedKeycloak = await this.setup.keycloak.start()
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

    this.startedServices = await Promise.all([
      ...this.setup.services.values().map((svc) =>
        svc.start().catch((error) => {
          throw new ContainerStartError(`Could not start ${svc.getOneCXAlias()}`, error)
        })
      )
    ])

    this.startedBffs = await Promise.all([
      ...this.setup.bffs.values().map((bff) =>
        bff.start().catch((error) => {
          throw new ContainerStartError(`Could not start ${bff.getOneCXAlias()}`, error)
        })
      )
    ])

    this.startedUis = await Promise.all([
      ...this.setup.uis.values().map((ui) =>
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
  private async importData() {
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

  private async defaultCheckDatabaseFunc(dbName: string, databaseContainer: StartedOneCXPostgresContainer) {
    return await databaseContainer.doesDatabaseExist(dbName, dbName)
  }
}

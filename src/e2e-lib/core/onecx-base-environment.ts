import { Network, StartedNetwork } from 'testcontainers'
import { OneCXPostgresContainer, StartedOneCXPostgresContainer } from './onecx-postgres'
import { containerImagesEnv } from '../constants/e2e-config'
import path from 'path'
import { exit } from 'process'
import { OneCXKeycloakContainer, StartedOneCXKeycloakContainer } from './onecx-keycloak'
import { OneCXThemeSvcContainer } from '../apps/onecx-theme-svc'
import { OneCXPermissionSvcContainer } from '../apps/onecx-permission-svc'
import { OneCXProductStoreSvcContainer } from '../apps/onecx-product-store-svc'
import { OneCXUserProfileSvcContainer } from '../apps/onecx-user-profile-svc'
import { OneCXIamKcSvcContainer } from '../apps/onecx-iam-kc-svc'
import { OneCXTenantSvcContainer } from '../apps/onecx-tenant-svc'
import { OneCXWorkspaceSvcContainer } from '../apps/onecx-workspace-svc'
import { OneCXSvcContainer } from '../abstract/onecx-svc'
import { OneCXBffContainer } from '../abstract/onecx-bff'
import { OneCXUiContainer } from '../abstract/onecx-ui'

export interface OneCXBaseConfig {
  checkDatabases?: boolean
  checkDatabaseFunc?: (dbName: string, databaseContainer: StartedOneCXPostgresContainer) => Promise<boolean>
}

export class OneCXBaseEnvironment {
  private network: StartedNetwork | undefined
  private database: OneCXPostgresContainer
  private keycloak: OneCXKeycloakContainer
  private services: Array<OneCXSvcContainer>
  private bffs: Array<OneCXBffContainer>
  private uis: Array<OneCXUiContainer>

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

  //   public withOneCX(container: OneCX) {
  //     return this
  //   }

  public async start(): Promise<StartedOneCXBaseEnvironment> {
    //--------NETWORK--------
    this.log('Starting network')
    this.network = this.network ?? (await new Network().start())
    if (!this.network) {
      // TODO: Fail if not started
      this.error('Network could not be started!')
      exit(0)
    }
    this.log('Network started')

    //--------DATABASE--------
    this.database = this.database ?? (await this.setupDatabase(this.network))
    const startedDatabase = await this.database.start()
    if (!startedDatabase) {
      // TODO: Fail if not started
      this.error('Database could not be started!')
      exit(0)
    }

    const databases = await startedDatabase.getOneCXDatabases()
    this.log(`Created databases ${databases}`)

    if (this.checkDatabases) {
      let allDatabasesExist = true
      // TODO: Check if databases exist
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
        // TODO: Fail
        this.error('Not all databases created!')
        exit(0)
      }
    }

    //--------KEYCLOAK--------
    this.keycloak = this.keycloak ?? (await this.setupKeycloak(this.network, startedDatabase))
    const startedKeycloak = await this.keycloak.start()
    if (!startedKeycloak) {
      // TODO: Fail if not started
      this.error('Keycloak could not be started!')
      exit(0)
    }

    //--------SERVICE--------

    //--------BFF--------

    //--------UI--------

    return new StartedOneCXBaseEnvironment(this.network, startedDatabase, startedKeycloak)
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

  private log(message: string) {
    console.log(`OneCXBaseEnvironment: ${message}`)
  }

  private error(message: string) {
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
    private keycloak: StartedOneCXKeycloakContainer
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

  public async teardown() {
    this.log('Starting teardown')

    await this.database.stop()
    this.log(`${this.database.getOneCXAlias()} stopped`)

    await this.keycloak.stop()
    this.log(`${this.keycloak.getOneCXAlias()} stopped`)

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

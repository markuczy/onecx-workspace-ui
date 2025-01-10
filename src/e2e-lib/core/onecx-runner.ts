import { OneCXAppContainer, StartedOneCXAppContainer } from '../abstract/onecx-app'
import { ContainerStartError } from '../model/container-start-error'
import { OneCXCoreApplication, OneCXCoreApplications } from '../model/onecx-application-type'
import { StartedOneCXEnvironment } from './onecx-base-environment'
import { StartedOneCXPostgresContainer } from './onecx-postgres'
import { OneCXSetup } from './onecx-setup'

export type CheckDatabaseFunc = (dbName: string, databaseContainer: StartedOneCXPostgresContainer) => Promise<boolean>

export interface OneCXRunnerStartParams {
  checkDatabases?: boolean
  checkDatabaseFunc?: CheckDatabaseFunc
  order?: Array<Array<OneCXCoreApplication | string>>
  startCore?: boolean
}

export interface OneCXRunner {
  start(setup: OneCXSetup, params: OneCXRunnerStartParams): Promise<StartedOneCXEnvironment>
  teardown(startedOneCXEnv: StartedOneCXEnvironment): Promise<void>
}

export class OneCXBaseRunner implements OneCXRunner {
  private checkDatabases: boolean = true
  private checkDatabaseFunc: CheckDatabaseFunc = this.defaultCheckDatabaseFunc
  private order: Array<Array<OneCXCoreApplication | string>> = [
    [
      OneCXCoreApplications.IAM,
      OneCXCoreApplications.PERMISSION,
      OneCXCoreApplications.PRODUCT_STORE,
      OneCXCoreApplications.SHELL,
      OneCXCoreApplications.TENANT,
      OneCXCoreApplications.THEME,
      OneCXCoreApplications.USER_PROFILE,
      OneCXCoreApplications.WORKSPACE
    ]
  ]
  private apps: Array<OneCXAppContainer> = []
  private startCore = true

  public async start(setup: OneCXSetup, params: OneCXRunnerStartParams): Promise<StartedOneCXEnvironment> {
    this.log('Starting environment')
    this.checkDatabases = params.checkDatabases ?? this.checkDatabases
    this.checkDatabaseFunc = params.checkDatabaseFunc ?? this.checkDatabaseFunc
    this.order = params.order ?? this.order

    this.apps = [...setup.services.values(), ...setup.bffs.values(), ...setup.uis.values()]
    this.startCore = params.startCore ?? this.startCore

    return await this.startAll(setup).finally(() => this.log('Started environment'))
  }

  public async teardown(startedOneCXEnv: StartedOneCXEnvironment) {
    this.log('Starting teardown')

    const database = startedOneCXEnv.getOneCXStartedDatabase()
    database && (await database.stop().then(() => this.log(`${database.getOneCXAlias()} stopped`)))

    const keycloak = startedOneCXEnv.getOneCXStartedKeycloak()
    keycloak && (await keycloak.stop().then(() => this.log(`${keycloak.getOneCXAlias()} stopped`)))

    const apps = [
      ...startedOneCXEnv.getOneCXStartedServices(),
      ...startedOneCXEnv.getOneCXStartedBffs(),
      ...startedOneCXEnv.getOneCXStartedUis()
    ]

    for (const batch of this.order.reverse()) {
      const promises = batch.flatMap((application) => {
        return this.stopApplication(apps, application)
      })
      await Promise.all(promises)
    }

    await Promise.all(apps.map((app) => app.stop())).then(() => this.log('All apps stopped'))

    const network = startedOneCXEnv.getOneCXNetwork()
    network && (await network.stop().then(() => this.log(`Network stopped`)))

    this.log('Finished teardown')
  }

  private async startAll(setup: OneCXSetup) {
    const database = await this.startDatabase(setup)
    const keycloak = await this.startKeycloak(setup)
    const startedApps: StartedOneCXAppContainer[] = []
    for (const batch of this.order) {
      const promises = batch.flatMap((application) => {
        return this.startApplication(application)
      })
      startedApps.push(...(await Promise.all(promises)))
    }

    if (this.startCore) {
      const promises = setup.coreApps
        .values()
        .map((app) => {
          if (
            startedApps.find(
              (startedApp) =>
                startedApp.getOneCXAppId() === app.getOneCXAppId() &&
                startedApp.getOneCXApplicationName() === app.getOneCXApplicationName() &&
                startedApp.getOneCXAppType() === app.getOneCXAppType()
            )
          ) {
            return undefined
          }

          return app.start()
        })
        .filter(
          (promiseOrUndefined): promiseOrUndefined is Promise<StartedOneCXAppContainer> =>
            promiseOrUndefined !== undefined
        )
      startedApps.push(...(await Promise.all(promises)))
    }

    return new StartedOneCXEnvironment(
      this,
      setup.network,
      database,
      keycloak,
      startedApps.filter((app) => app.getOneCXAppType() === 'SVC'),
      startedApps.filter((app) => app.getOneCXAppType() === 'BFF'),
      startedApps.filter((app) => app.getOneCXAppType() === 'UI')
    )
  }

  private startApplication(applicationName: string) {
    const appsToStart = this.apps.filter((app) => app.getOneCXApplicationName() === applicationName)
    return appsToStart.map((app) =>
      app.start().catch((error) => {
        throw new ContainerStartError(`Could not start ${app.getOneCXAlias()}`, error)
      })
    )
  }

  private stopApplication(apps: Array<StartedOneCXAppContainer>, applicationName: string) {
    const appsToStop = apps.filter((app) => app.getOneCXApplicationName() === applicationName)
    return appsToStop.map((app) =>
      app.stop().catch((error) => {
        throw new ContainerStartError(`Could not stop ${app.getOneCXAlias()}`, error)
      })
    )
  }

  private async startDatabase(setup: OneCXSetup) {
    const database = await setup.database.start()
    if (!database) {
      throw new ContainerStartError('Could not start database container.')
    }

    const databases = await database.getOneCXDatabases()
    this.log(`Created databases ${databases}`)

    if (this.checkDatabases) {
      let allDatabasesExist = true
      for (const db of databases) {
        this.log(`Checking existence of ${db} database`)
        const dbExists = await this.checkDatabaseFunc(db, database)
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

    return database
  }

  private async startKeycloak(setup: OneCXSetup) {
    const keycloak = await setup.keycloak.start()
    if (!keycloak) {
      throw new ContainerStartError('Could not start keycloak.')
    }

    return keycloak
  }

  private async defaultCheckDatabaseFunc(dbName: string, databaseContainer: StartedOneCXPostgresContainer) {
    return await databaseContainer.doesDatabaseExist(dbName, dbName)
  }

  private log(message: string) {
    console.log(`OneCXBaseRunner: ${message}`)
  }

  private error(message: string) {
    console.error(`OneCXBaseRunner: ${message}`)
  }
}

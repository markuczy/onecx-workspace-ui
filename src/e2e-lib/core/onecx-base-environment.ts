import { StartedNetwork } from 'testcontainers'
import { OneCXPostgresContainer, StartedOneCXPostgresContainer } from './onecx-postgres'
import path from 'path'
import { OneCXKeycloakContainer, StartedOneCXKeycloakContainer } from './onecx-keycloak'
import { OneCXSvcContainer, StartedOneCXSvcContainer } from '../abstract/onecx-svc'
import { OneCXBffContainer, StartedOneCXBffContainer } from '../abstract/onecx-bff'
import { OneCXUiContainer, StartedOneCXUiContainer } from '../abstract/onecx-ui'
import { importDatabaseData } from '../utils/utils'
import { OneCXSetup } from './onecx-setup'
import { OneCXRunner, OneCXRunnerStartParams } from './onecx-runner'

export class OneCXEnvironment {
  constructor(
    private readonly network: StartedNetwork,
    private readonly setup: OneCXSetup,
    private readonly runner: OneCXRunner
  ) {}

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

  public getOneCXKeycloak() {
    return this.setup.keycloak
  }

  public getOneCXServices() {
    return this.setup.services
  }

  public getOneCXBffs() {
    return this.setup.bffs
  }

  public getOneCXUis() {
    return this.setup.uis
  }

  public getOneCXService(appId: string) {
    return this.setup.services.values().find((svc) => svc.getOneCXAppId() === appId)
  }

  public getOneCXBff(appId: string) {
    return this.setup.bffs.values().find((bff) => bff.getOneCXAppId() === appId)
  }

  public getOneCXUi(appId: string) {
    return this.setup.uis.values().find((ui) => ui.getOneCXAppId() === appId)
  }

  public async start(params: OneCXRunnerStartParams): Promise<StartedOneCXEnvironment> {
    return this.runner.start(this.setup, params)
  }
}

export class StartedOneCXEnvironment {
  constructor(
    private readonly runner: OneCXRunner,
    private readonly network: StartedNetwork,
    private readonly database: StartedOneCXPostgresContainer,
    private readonly keycloak: StartedOneCXKeycloakContainer,
    private readonly services: Array<StartedOneCXSvcContainer>,
    private readonly bffs: Array<StartedOneCXBffContainer>,
    private readonly uis: Array<StartedOneCXUiContainer>
  ) {}

  public getOneCXNetwork() {
    return this.network
  }

  public getOneCXStartedDatabase() {
    return this.database
  }

  public getOneCXStartedKeycloak() {
    return this.keycloak
  }

  public getOneCXStartedServices() {
    return this.services
  }

  public getOneCXStartedBffs() {
    return this.bffs
  }

  public getOneCXStartedUis() {
    return this.uis
  }

  public getOneCXStartedService(appId: string) {
    return this.services.find((svc) => svc.getOneCXAppId() === appId)
  }

  public getOneCXStartedBff(appId: string) {
    return this.bffs.find((bff) => bff.getOneCXAppId() === appId)
  }

  public getOneCXStartedUi(appId: string) {
    return this.uis.find((ui) => ui.getOneCXAppId() === appId)
  }

  public getOneCXShellUi() {
    return this.uis.find((ui) => ui.getOneCXAppId() === 'shell-ui')
  }

  public async teardown() {
    await this.runner.teardown(this)
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
}

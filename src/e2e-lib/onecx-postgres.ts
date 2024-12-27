import { StartedNetwork, StartedTestContainer } from 'testcontainers'
import { OneCXContainer, StartedOneCXContainer } from './onecx-container'

// TODO: Add db creation?
// TODO: Add command running so someone can extend the database contents?
export class OneCXPostgresContainer extends OneCXContainer {
  private onecxStartCommand: string[]

  constructor(
    image: string,
    network: StartedNetwork,
    private readonly initDataPath?: string
  ) {
    super(image, network)

    this.withOneCXNameAndAlias('postgresdb')
      .withOneCXEnvironment({
        POSTGRES_DB: 'postgres',
        POSTGRES_USER: 'postgres',
        POSTGRES_PASSWORD: 'admin'
      })
      .withOneCXHealthCheck({
        test: ['CMD-SHELL', 'pg_isready -U postgres'],
        interval: 10_000,
        timeout: 5_000,
        retries: 3
      })
      .withOneCXStartCommand(['-cmax_prepared_transactions=100'])
      .withOneCXExposedPort(5432)
  }

  public withOneCXStartCommand(startCommand: string[]) {
    this.onecxStartCommand = startCommand
    return this
  }

  public getOneCXStartCommand() {
    return this.onecxStartCommand
  }

  async start(): Promise<StartedOneCXPostgresContainer> {
    this.withCommand(this.onecxStartCommand)

    if (this.initDataPath) {
      this.withCopyDirectoriesToContainer([
        {
          source: this.initDataPath,
          target: '/docker-entrypoint-initdb.d/'
        }
      ])
    }

    return new StartedOneCXPostgresContainer(await super.start(), this.getOneCXAlias())
  }
}

export class StartedOneCXPostgresContainer extends StartedOneCXContainer {
  constructor(startedTestContainer: StartedTestContainer, alias?: string) {
    super(startedTestContainer, alias)
  }

  public async getOneCXDatabases(): Promise<string[]> {
    const { stdout, stderr, exitCode } = await this.exec([
      'psql',
      '-U',
      'postgres',
      '-tc',
      `SELECT datname FROM pg_database`
    ])

    if (exitCode === 0) {
      return [stdout]
    } else {
      console.error(`Error listing databases: ${stderr}`)
      return []
    }
  }

  public async doesDatabaseExist(user: string, database: string): Promise<boolean> {
    const { stdout } = await this.exec([
      'psql',
      '-U',
      user,
      '-tc',
      `SELECT 1 FROM pg_database WHERE datname='${database}'`
    ])
    return stdout.trim() === '1'
  }
}

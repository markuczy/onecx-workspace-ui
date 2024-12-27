import { AbstractStartedContainer, GenericContainer, StartedNetwork, StartedTestContainer, Wait } from 'testcontainers'
import { HealthCheck } from 'testcontainers/build/types'
import { ContainerEnv } from '../model/container-env'

// TODO: Option to configure the log consumer?
export class OneCXContainer extends GenericContainer {
  private onecxEnv: ContainerEnv | undefined
  private onecxHealthCheck: HealthCheck | undefined
  private onecxExposedPort: number | undefined

  constructor(
    image: string,
    private onecxNameAndAlias: string,
    private readonly network: StartedNetwork
  ) {
    super(image)
  }

  public withOneCXNameAndAlias(nameAndAlias: string) {
    this.onecxNameAndAlias = nameAndAlias
    return this
  }

  public getOneCXName() {
    return this.onecxNameAndAlias
  }

  public getOneCXAlias() {
    return this.onecxNameAndAlias
  }

  public withOneCXEnvironment(env: ContainerEnv) {
    this.onecxEnv = env
    return this
  }

  public getOneCXEnvironment() {
    return this.onecxEnv
  }

  public withOneCXHealthCheck(healthCheck: HealthCheck) {
    this.onecxHealthCheck = healthCheck
    return this
  }

  public getOneCXHealthCheck() {
    return this.onecxHealthCheck
  }

  public withOneCXExposedPort(port: number) {
    this.onecxExposedPort = port
    return this
  }

  public getOneCXExposedPort() {
    return this.onecxExposedPort
  }

  public getOneCXNetwork() {
    return this.network
  }

  public async start(): Promise<StartedOneCXContainer> {
    this.log('Starting container')

    this.onecxNameAndAlias &&
      this.withName(this.onecxNameAndAlias)
        .withNetworkAliases(this.onecxNameAndAlias)
        .withEnvironment(this.onecxEnv ?? {})

    this.onecxHealthCheck && this.withHealthCheck(this.onecxHealthCheck).withWaitStrategy(Wait.forHealthCheck())

    this.onecxExposedPort && this.withExposedPorts(this.onecxExposedPort)

    this.withNetwork(this.network).withLogConsumer((stream) => {
      stream.on('data', (line) => console.log(`${this.onecxNameAndAlias}: `, line))
      stream.on('err', (line) => console.error(`${this.onecxNameAndAlias}: `, line))
      stream.on('end', () => console.log(`${this.onecxNameAndAlias}: Stream closed`))
    })

    return new StartedOneCXContainer(await super.start(), this.onecxNameAndAlias, this.onecxExposedPort)
  }

  private log(message: string) {
    console.log(`${this.onecxNameAndAlias ?? this.imageName}: ${message}`)
  }

  private error(message: string) {
    console.error(`${this.onecxNameAndAlias ?? this.imageName}: ${message}`)
  }
}

export class StartedOneCXContainer extends AbstractStartedContainer {
  constructor(
    startedTestContainer: StartedTestContainer,
    private readonly onecxAlias: string,
    private readonly exposedPort?: number
  ) {
    super(startedTestContainer)

    this.log('Started container')
  }

  public getOneCXAlias() {
    return this.onecxAlias
  }

  public getOneCXExposedPort() {
    return this.exposedPort
  }

  private log(message: string) {
    console.log(`${this.onecxAlias ?? this.getName()}: ${message}`)
  }

  private error(message: string) {
    console.error(`${this.onecxAlias ?? this.getName()}: ${message}`)
  }
}

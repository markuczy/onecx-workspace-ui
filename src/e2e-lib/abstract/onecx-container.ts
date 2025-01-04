import { AbstractStartedContainer, GenericContainer, StartedNetwork, StartedTestContainer, Wait } from 'testcontainers'
import { HealthCheck } from 'testcontainers/build/types'
import { ContainerEnv } from '../model/container-env'

// TODO: Configure log consumer
export class OneCXContainer extends GenericContainer {
  private onecxEnv: ContainerEnv | undefined
  private onecxHealthCheck: HealthCheck | undefined
  private onecxExposedPort: number | undefined

  constructor(
    image: string,
    private name: string,
    private alias: string,
    private readonly network: StartedNetwork
  ) {
    super(image)
  }

  public withOneCXName(name: string) {
    this.name = name
  }

  public withOneCXAlias(alias: string) {
    this.alias = alias
  }

  public getOneCXName() {
    return this.name
  }

  public getOneCXAlias() {
    return this.alias
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

    this.name &&
      this.withName(this.name)
        .withNetworkAliases(this.alias)
        .withEnvironment(this.onecxEnv ?? {})

    this.onecxHealthCheck && this.withHealthCheck(this.onecxHealthCheck).withWaitStrategy(Wait.forHealthCheck())

    this.onecxExposedPort && this.withExposedPorts(this.onecxExposedPort)

    this.withNetwork(this.network).withLogConsumer((stream) => {
      stream.on('data', (line) => console.log(`${this.name}: `, line))
      stream.on('err', (line) => console.error(`${this.name}: `, line))
      stream.on('end', () => console.log(`${this.name}: Stream closed`))
    })

    return new StartedOneCXContainer(await super.start(), this.name, this.alias, this.network, this.onecxExposedPort)
  }

  protected log(message: string) {
    console.log(`${this.name ?? this.imageName}: ${message}`)
  }

  protected error(message: string) {
    console.error(`${this.name ?? this.imageName}: ${message}`)
  }
}

export class StartedOneCXContainer extends AbstractStartedContainer {
  constructor(
    startedTestContainer: StartedTestContainer,
    private readonly onecxName: string,
    private readonly onecxAlias: string,
    private readonly onecxNetwork: StartedNetwork,
    private readonly onecxExposedPort?: number
  ) {
    super(startedTestContainer)
  }

  public getOneCXName() {
    return this.onecxName
  }

  public getOneCXAlias() {
    return this.onecxAlias
  }

  public getOneCXExposedPort() {
    return this.onecxExposedPort
  }

  public getOneCXNetwork() {
    return this.onecxNetwork
  }

  protected log(message: string) {
    console.log(`${this.onecxName ?? this.getName()}: ${message}`)
  }

  protected error(message: string) {
    console.error(`${this.onecxName ?? this.getName()}: ${message}`)
  }
}

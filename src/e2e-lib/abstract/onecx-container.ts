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
    private nameAndAlias: string,
    private readonly network: StartedNetwork
  ) {
    super(image)
  }

  public withOneCXNameAndAlias(nameAndAlias: string) {
    this.nameAndAlias = nameAndAlias
    return this
  }

  public getOneCXNameAndAlias() {
    return this.nameAndAlias
  }

  public getOneCXName() {
    return this.nameAndAlias
  }

  public getOneCXAlias() {
    return this.nameAndAlias
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

    this.nameAndAlias &&
      this.withName(this.nameAndAlias)
        .withNetworkAliases(this.nameAndAlias)
        .withEnvironment(this.onecxEnv ?? {})

    this.onecxHealthCheck && this.withHealthCheck(this.onecxHealthCheck).withWaitStrategy(Wait.forHealthCheck())

    this.onecxExposedPort && this.withExposedPorts(this.onecxExposedPort)

    this.withNetwork(this.network).withLogConsumer((stream) => {
      stream.on('data', (line) => console.log(`${this.nameAndAlias}: `, line))
      stream.on('err', (line) => console.error(`${this.nameAndAlias}: `, line))
      stream.on('end', () => console.log(`${this.nameAndAlias}: Stream closed`))
    })

    return new StartedOneCXContainer(await super.start(), this.nameAndAlias, this.network, this.onecxExposedPort)
  }

  protected log(message: string) {
    console.log(`${this.nameAndAlias ?? this.imageName}: ${message}`)
  }

  protected error(message: string) {
    console.error(`${this.nameAndAlias ?? this.imageName}: ${message}`)
  }
}

export class StartedOneCXContainer extends AbstractStartedContainer {
  constructor(
    startedTestContainer: StartedTestContainer,
    private readonly onecxAlias: string,
    private readonly onecxNetwork: StartedNetwork,
    private readonly onecxExposedPort?: number
  ) {
    super(startedTestContainer)
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
    console.log(`${this.onecxAlias ?? this.getName()}: ${message}`)
  }

  protected error(message: string) {
    console.error(`${this.onecxAlias ?? this.getName()}: ${message}`)
  }
}

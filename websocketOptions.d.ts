import { WebSocketConstructor } from './types.js'

export declare type Timeout = number

export declare const DefaultTimeout: Timeout, LongTimeout: Timeout

export declare type Port = number

export declare const HTTPSPort: Port, HTTPPort: Port

export declare class Options {
  constructor(
    host: string,
    timeout?: Timeout,
    secure?: boolean,
    port?: Port,
    longpoll?: boolean
  )

  setAllowInsecure(value: boolean): this

  setMaxMessageBytes(value: number): this

  get maxMessageBytes(): number

  setMaxPendingCallbacks(value: number): this

  get maxPendingCallbacks(): number

  check(): boolean

  get isLongPool(): boolean

  setDebug(debug: boolean): Options

  get debug(): boolean

  setEndpoints(wsEndpoint?: string, longpollEndpoint?: string): Options

  get endpoints(): readonly string[]

  setMaxConnectionDelay(delay: number): Options

  get maxConnectionDelay(): number

  setMinReconnectionDelay(delay: number): Options

  get minReconnectionDelay(): number

  setReconnectionDelayGrowFactor(gw: number): Options

  get reconnectionDelayGrowFactor(): number

  setMinUptime(ut: number): Options

  get minUptime(): number

  setMaxRetries(retries: number): Options

  get maxRetries(): number

  setMaxEnqueuedMessages(em: number): Options

  get maxEnqueuedMessages(): number

  setProtocols(protocols: string[]): Options

  get protocols(): readonly string[]

  setCustomWS(customWS: WebSocketConstructor): Options

  get customWS(): WebSocketConstructor | undefined

  get url(): string

  make(): {
    WebSocket?: any
    maxReconnectionDelay: number
    minReconnectionDelay: number
    reconnectionDelayGrowFactor: number
    minUptime: number
    connectionTimeout: number
    maxRetries: number
    maxEnqueuedMessages: number
    startClosed: boolean
    debug: boolean
  }
}

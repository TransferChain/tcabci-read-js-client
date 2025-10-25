export declare type Timeout = number
export declare const DefaultTimeout: Timeout, LongTimeout: Timeout

export declare type Port = number
export declare const HTTPSPort: Port, HTTPPort: Port

export declare class Options {
  constructor(
    host: string,
    timeout: Timeout,
    secure: boolean,
    port: Port,
    longpoll: boolean,
  )
  check(): boolean
  isLongPool(): boolean
  setDebug(debug: boolean): Options
  get debug(): boolean
  setEndpoints(wsEndpoint: string, longpollEndpoint: string): Options
  endpoints(): string[]
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
  get protocols(): string[]
  setCustomWS(customWS: WebSocket): Options
  get customWS(): WebSocket | undefined
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

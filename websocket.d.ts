import { SocketCloseEvent } from './types.js'
import { Options } from './websocketOptions.js'

export declare const MaxListenerSize: number

export declare class TWebSocket {
  constructor(options: Options)

  get active(): boolean

  get ready(): boolean

  get openListeners(): readonly ((event: Event) => void)[]

  get messageListeners(): readonly ((event: MessageEvent) => void)[]

  get errorListeners(): readonly ((event: Error | Event) => void)[]

  get closeListeners(): readonly ((event: SocketCloseEvent) => void)[]

  connect(force?: boolean): Promise<TWebSocket>

  reconnect(code?: number): Promise<TWebSocket>

  disconnect(code?: number): Promise<void>

  send(message: string | ArrayBuffer | Blob | ArrayBufferView): void

  addOpenListener(callback: (event: Event) => void): TWebSocket

  removeOpenListener(callback: (event: Event) => void): TWebSocket

  addMessageListener(callback: (event: MessageEvent) => void): TWebSocket

  removeMessageListener(callback: (event: MessageEvent) => void): TWebSocket

  addErrorListener(callback: (event: Error | Event) => void): TWebSocket

  removeErrorListener(callback: (event: Error | Event) => void): TWebSocket

  addCloseListener(callback: (event: SocketCloseEvent) => void): TWebSocket

  removeCloseListener(callback: (event: SocketCloseEvent) => void): TWebSocket
}

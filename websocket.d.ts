import { Options } from './websocketOptions'

export declare const MaxListenerSize: number

export declare class TWebSocket {
  constructor(options: Options)
  get ready(): boolean
  get openListeners(): (() => void)[]
  get messageListeners(): (() => void)[]
  get errorListeners(): (() => void)[]
  get closeListeners(): (() => void)[]
  connect(force?: boolean): Awaited<TWebSocket>
  reconnect(code: number): Awaited<TWebSocket>
  disconnect(code: number): Awaited<TWebSocket>
  send(message: (string|ArrayBufferLike|Blob|ArrayBufferView)): void
  addOpenListener(callback: (event: Event) => void): TWebSocket
  removeOpenListener(callback: (event: Event) => void): TWebSocket
  addMessageListener(callback: (event: Event) => void): TWebSocket
  removeMessageListener(callback: (event: Event) => void): TWebSocket
  addErrorListener(callback: (event: Event) => void): TWebSocket
  removeErrorListener(callback: (event: Event) => void): TWebSocket
  addCloseListener(callback: (event: Event) => void): TWebSocket
  removeCloseListener(callback: (event: Event) => void): TWebSocket
}

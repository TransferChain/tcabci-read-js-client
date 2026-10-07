/** Immutable JSON snapshot; byte buffers are not JSON values. */
export type JSONValue =
  | null
  | boolean
  | number
  | string
  | readonly JSONValue[]
  | { readonly [key: string]: JSONValue }

export type ParseResult<K extends string, T> =
  | ({ [P in K]: T } & { error: null })
  | ({ [P in K]: null } & { error: Error })

/** Total request deadline, including retries and response consumption. */
export interface RequestOptions {
  signal?: AbortSignal
  timeoutMs?: number
  maxResponseBytes?: number
}

export interface ClientOptions {
  allowInsecure?: boolean
  timeoutMs?: number
  maxResponseBytes?: number
  maxRequestBytes?: number
  maxConcurrentRequests?: number
  maxMessageBytes?: number
  maxEnqueuedMessages?: number
  maxPendingCallbacks?: number
}

/** Browser WebSocket and ws constructors can both be injected. */
export interface WebSocketLike {
  readonly readyState: number
  readonly bufferedAmount: number
  binaryType: string

  close(code?: number, reason?: string): void

  send(data: any): void

  addEventListener(type: string, listener: any): void

  removeEventListener(type: string, listener: any): void
}

export interface WebSocketConstructor {
  new (url: string | URL, protocols?: string | string[]): WebSocketLike

  readonly CONNECTING: number
  readonly OPEN: number
  readonly CLOSING: number
  readonly CLOSED: number
}

export interface SocketCloseEvent {
  readonly code: number
  readonly reason: string
  readonly wasClean: boolean
}

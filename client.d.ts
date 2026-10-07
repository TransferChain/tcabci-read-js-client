import { Transaction, TXType } from './transaction.js'
import { TWebSocket } from './websocket.js'
import {
  SuccessCallback,
  ErrorCallback,
  CloseCallback,
  ListenCallback
} from './callback.js'
import {
  ClientOptions,
  RequestOptions,
  WebSocketConstructor,
  JSONValue
} from './types.js'

export type {
  ClientOptions,
  RequestOptions,
  WebSocketConstructor
} from './types.js'

export interface TxQuery {
  recipientAddrs?: readonly string[]
  senderAddrs?: readonly string[]
  signedData?: Readonly<Record<string, string>>
  typ?: TXType
  types?: readonly TXType[] | null
  chainName?: string | null
  chainVersion?: string | null
}

export interface TxSearchQuery extends TxQuery {
  heightOperator?: string
  height?: number
  maxHeight?: number
  lastOrder?: number
  hashes?: readonly string[]
  limit?: number
  offset?: number
  orderField?: string
  orderBy?: string
}

export interface BroadcastInput {
  id: string
  version: number
  type: TXType
  data: JSONValue
  additional_data?: JSONValue
  cipher_data?: JSONValue
  sender_addr: string
  recipient_addr: string
  sign: string
  fee: number
}

export interface ClientStatus {
  readonly chain_name: string
  readonly chain_version: string
  readonly connected: boolean
  readonly subscribed: boolean
}

/** Call Start to initiate a socket; the success callback reports OPEN. */
export default class TCaBCIClient {
  constructor(
    readNodeAddresses?: readonly string[],
    wsLibrary?: WebSocketConstructor,
    chainName?: string | null,
    chainVersion?: string | null,
    options?: ClientOptions
  )

  SetDebug(debug: boolean): this

  SetSuccessCallback(cb: SuccessCallback | null): this

  SetErrorCallback(cb: ErrorCallback | null): this

  SetCloseCallback(cb: CloseCallback | null): this

  SetListenCallback(cb: ListenCallback | null): this

  IsConnected(): boolean

  IsSubscribed(): boolean

  get SubscribeAddresses(): readonly string[]

  get SubscribedSignedData(): Readonly<Record<string, string>>

  get Socket(): TWebSocket | null | undefined

  Start(): Promise<TWebSocket>

  /** Idempotently closes the socket, clears subscription state and aborts HTTP. */
  Stop(code?: number): Promise<this>

  /** Also releases application callback references. */
  Dispose(): Promise<this>

  Reconnect(code?: number): Promise<this>

  Status(): Readonly<ClientStatus>

  Subscribe(
    addresses: readonly string[],
    signedData: Readonly<Record<string, string>>,
    txTypes?: readonly TXType[] | null
  ): this

  Unsubscribe(): this

  LastBlock(
    chainName?: string | null,
    chainVersion?: string | null,
    options?: RequestOptions
  ): Promise<{
    readonly blocks: readonly Transaction[]
    readonly info: {
      readonly chainName: string
      readonly chainVersion: string
      readonly hash: string
      readonly height: number
      readonly txs: number
      readonly createdAt: Date
    }
    readonly total_count: number
  }>

  Tx(
    id: string,
    signature: string,
    options?: RequestOptions
  ): Promise<Readonly<{ readonly tx: Transaction }>>

  TxSummary(
    query: TxQuery,
    options?: RequestOptions
  ): Promise<{
    readonly chain_name: string
    readonly chain_version: string
    readonly first_block_height: number
    readonly first_transaction: Transaction | undefined
    readonly last_block_height: number
    readonly last_transaction: Transaction | undefined
    readonly total_count: number
  }>

  TxSearch(
    query: TxSearchQuery,
    options?: RequestOptions
  ): Promise<{
    readonly txs: readonly Transaction[]
    readonly total_count: number
  }>

  BroadcastCommit(
    input: BroadcastInput,
    options?: RequestOptions
  ): Promise<Readonly<{ readonly data: JSONValue }>>

  BroadcastSync(
    input: BroadcastInput,
    options?: RequestOptions
  ): Promise<Readonly<{ readonly data: JSONValue }>>

  Broadcast(
    input: BroadcastInput,
    options?: RequestOptions
  ): Promise<Readonly<{ readonly data: JSONValue }>>

  broadcast(
    input: BroadcastInput,
    sync?: boolean,
    commit?: boolean,
    options?: RequestOptions
  ): Promise<Readonly<{ readonly data: JSONValue }>>

  Bulk(
    addresses?: readonly string[],
    signedData?: Readonly<Record<string, string>>,
    maxHeight?: number | null,
    chainName?: string | null,
    chainVersion?: string | null,
    options?: RequestOptions
  ): Promise<JSONValue>
}

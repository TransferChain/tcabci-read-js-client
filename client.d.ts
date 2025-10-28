import { TXType } from './transaction'
import { SuccessCallback, ErrorCallback, CloseCallback, ListenCallback } from './callback'

declare class TCaBCIClient {
  constructor(
    readNodeAddresses: string[],
    wsLibrary: WebSocket,
    chainName: string,
    chainVersion: string,
  )
  SetDebug(debug: boolean): TCaBCIClient
  SetSuccessCallback(cb: SuccessCallback): TCaBCIClient
  SetErrorCallback(cb: ErrorCallback): TCaBCIClient
  SetCloseCallback(cb: CloseCallback): TCaBCIClient
  SetListenCallback(cb: ListenCallback): TCaBCIClient
  IsConnected(): boolean
  IsSubscribed(): boolean
  get SubscribeAddresses(): string[]
  get SubscribedSignedData(): Record<string, string> | null
  get Socket(): WebSocket
  Start(): Awaited<TCaBCIClient>
  Stop(code?: number): Awaited<TCaBCIClient>
  Reconnect(code?: number): Awaited<TCaBCIClient>
  Status(): {
    chain_name: string
    chain_version: string
    connected: boolean
    subscribed: boolean
  }
  Subscribe(
    addresses: string[],
    signedData: Record<string, string>,
    txTypes?: TXType[],
  ): TCaBCIClient
  Unsubscribe(): TCaBCIClient
  LastBlock(
    chainName?: null,
    chainVersion?: null,
  ): { blocks: Record<string, any>; total_count: number }
  Tx(id: string, signature: string): Promise<{ tx: Record<string, any> }>
  TxSummary({
    recipientAddrs,
    senderAddrs,
    signedData,
    typ,
    types,
    chainName,
    chainVersion,
  }: Record<string, any>): Promise<{
    chain_name: string
    chain_version: string
    first_block_height: number
    first_transaction: Record<string, any>
    last_block_height: number
    last_transaction: Record<string, any>
    total_count: number
  }>
  TxSearch({
    heightOperator,
    height,
    maxHeight,
    lastOrder,
    recipientAddrs,
    senderAddrs,
    signedData,
    hashes,
    typ,
    types,
    limit,
    offset,
    orderField,
    orderBy,
    chainName,
    chainVersion,
  }): Promise<{ txs: Record<string, any>[]; total_count: number }>
  BroadcastCommit({
    id,
    version,
    type,
    data,
    sender_addr,
    recipient_addr,
    sign,
    fee,
  }): Promise<{ data: Record<string, any> }>
  BroadcastSync({
    id,
    version,
    type,
    data,
    sender_addr,
    recipient_addr,
    sign,
    fee,
  }): Promise<{ data: Record<string, any> }>
  Broadcast({
    id,
    version,
    type,
    data,
    sender_addr,
    recipient_addr,
    sign,
    fee,
  }): Promise<{ data: Record<string, any> }>
  Bulk(
    addresses: string[],
    signedData: Record<string, any>,
    maxHeight?: number,
    chainName?: string,
    chainVersion?: string,
  ): Promise<{ data: Record<string, any> }>
}

export = TCaBCIClient

import { JSONValue, ParseResult } from './types.js'

export type TXType =
  | 'initial_storage'
  | 'interim_storage'
  | 'interim_storages'
  | 'initial_account'
  | 'initial_account_txs'
  | 'message'
  | 'inherit_message'
  | 'inherit_message_recv'
  | 'transfer'
  | 'transfer_Cancel'
  | 'transfer_sent'
  | 'transfer_receive_delete'
  | 'transfer_info'
  | 'storage'
  | 'storage_delete'
  | 'backup'
  | 'interim_message'
  | 'fs_virt'
  | 'fs_real'
  | 'fs_rvirt'
  | 'fs_rreal'
  | 'fs_dvirt'
  | 'fs_dreal'
  | 'fs_pvirt'
  | 'request'
  | 'request_in'
  | 'request_upload'
  | 'request_Cancel'
  | 'data_room'
  | 'data_roomF'
  | 'data_room_policy'
  | 'data_room_data'
  | 'data_room_data_delete'
  | 'data_room_data_policy'
  | 'data_roomE'
  | 'data_roomE_data'
  | 'multi_data_room'
  | 'multi_storage'
  | 'multi_transfer'
  | 'multi_transfer_sent'
  | 'multi_backup'
  | 'multi_passwd'
  | 'multi_collection'
  | 'multi_dataV2'
  | 'passwd_data'
  | 'passwd_room'
  | 'passwd_roomF'
  | 'passwd_room_policy'
  | 'passwd_room_data'
  | 'passwd_room_data_delete'
  | 'passwd_room_data_policy'
  | 'datav2'
  | 'datav2_policy'
  | 'coll'
  | 'coll_policy'
  | 'datav2_coll'
  | 'datav2F'

export declare const TX_TYPE_MASTER: 'initial_storage',
  TX_TYPE_ADDRESS: 'interim_storage',
  TX_TYPE_ADDRESSES: 'interim_storages',
  TX_TYPE_ACCOUNT: 'initial_account',
  TX_TYPE_ACCOUNT_INITIAL_TXS: 'initial_account_txs',
  TX_TYPE_MESSAGE: 'message',
  TX_TYPE_MESSAGE_SENT: 'inherit_message',
  TX_TYPE_MESSAGE_THREAD_DELETE: 'inherit_message_recv',
  TX_TYPE_TRANSFER: 'transfer',
  TX_TYPE_TRANSFER_CANCEL: 'transfer_Cancel',
  TX_TYPE_TRANSFER_SENT: 'transfer_sent',
  TX_TYPE_TRANSFER_RECEIVE_DELETE: 'transfer_receive_delete',
  TX_TYPE_TRANSFER_INFO: 'transfer_info',
  TX_TYPE_STORAGE: 'storage',
  TX_TYPE_STORAGE_DELETE: 'storage_delete',
  TX_TYPE_BACKUP: 'backup',
  TX_TYPE_CONTACT: 'interim_message',
  TX_TYPE_FILE_VIRTUAL: 'fs_virt',
  TX_TYPE_FILE_FS: 'fs_real',
  TX_TYPE_RFILE_VIRTUAL: 'fs_rvirt',
  TX_TYPE_RFILE_FS: 'fs_rreal',
  TX_TYPE_DFILE_VIRTUAL: 'fs_dvirt',
  TX_TYPE_DFILE_FS: 'fs_dreal',
  TX_TYPE_PFILE_VIRTUAL: 'fs_pvirt',
  TX_TYPE_REQUEST: 'request',
  TX_TYPE_REQUEST_IN: 'request_in',
  TX_TYPE_REQUEST_UPLOAD: 'request_upload',
  TX_TYPE_REQUEST_CANCEL: 'request_Cancel',
  TX_TYPE_DATA_ROOM: 'data_room',
  TX_TYPE_DATA_ROOMF: 'data_roomF',
  TX_TYPE_DATA_ROOM_POLICY: 'data_room_policy',
  TX_TYPE_DATA_ROOM_DATA: 'data_room_data',
  TX_TYPE_DATA_ROOM_DATA_DELETE: 'data_room_data_delete',
  TX_TYPE_DATA_ROOM_DATA_POLICY: 'data_room_data_policy',
  TX_TYPE_DATA_ROOME: 'data_roomE',
  TX_TYPE_DATA_ROOME_DATA: 'data_roomE_data',
  TX_TYPE_MULTI_DATA_ROOM: 'multi_data_room',
  TX_TYPE_MULTI_STORAGE: 'multi_storage',
  TX_TYPE_MULTI_TRANSFER: 'multi_transfer',
  TX_TYPE_MULTI_TRANSFER_SENT: 'multi_transfer_sent',
  TX_TYPE_MULTI_BACKUP: 'multi_backup',
  TX_TYPE_MULTI_PASSWD: 'multi_passwd',
  TX_TYPE_MULTI_COLLECTION: 'multi_collection',
  TX_TYPE_MULTI_DATAV2: 'multi_dataV2',
  TX_TYPE_PASSWD_DATA: 'passwd_data',
  TX_TYPE_PASSWD_ROOM: 'passwd_room',
  TX_TYPE_PASSWD_ROOMF: 'passwd_roomF',
  TX_TYPE_PASSWD_ROOM_POLICY: 'passwd_room_policy',
  TX_TYPE_PASSWD_ROOM_DATA: 'passwd_room_data',
  TX_TYPE_PASSWD_ROOM_DATA_DELETE: 'passwd_room_data_delete',
  TX_TYPE_PASSWD_ROOM_DATA_POLICY: 'passwd_room_data_policy',
  TX_TYPE_DATAV2: 'datav2',
  TX_TYPE_DATAV2_POLICY: 'datav2_policy',
  TX_TYPE_COLLECTION: 'coll',
  TX_TYPE_COLLECTION_POLICY: 'coll_policy',
  TX_TYPE_DATAV2_COLLECTION: 'datav2_coll',
  TX_TYPE_DATAV2F: 'datav2F',
  TX_TYPE_LIST: readonly TXType[]

export interface TransactionInput {
  id: string
  height: number
  version: number
  typ: TXType
  sender_addr: string
  recipient_addr: string
  data: JSONValue
  sign: string
  fee: number
  hash?: string
  /** Date text/RFC3339Nano, Unix milliseconds or a caller-owned Date. */
  inserted_at?: string | number | Date
  additionalData?: JSONValue
  cipherData?: JSONValue
  chainName?: string
  chainVersion?: string
}

/** Factory results and their JSON data are immutable snapshots. */
export declare class Transaction {
  constructor(input?: Partial<TransactionInput>)

  get Order(): number | undefined

  get ID(): string

  get Height(): number

  get Version(): number

  get Typ(): TXType

  get SenderAddr(): string

  get RecipientAddr(): string

  get Data(): JSONValue

  get AdditionalData(): JSONValue | undefined

  get CipherData(): JSONValue | undefined

  get Sign(): string

  get Fee(): number

  get Hash(): string | undefined

  /** Returns a detached Date; mutating it never changes the transaction. */
  get InsertedAt(): Date | undefined

  get ChainName(): string | undefined

  get ChainVersion(): string | undefined

  static FromJSON(
    value: string
  ): ParseResult<'transaction', Readonly<Transaction>>

  static FromObject(
    obj: Record<string, unknown>
  ): ParseResult<'transaction', Readonly<Transaction>>

  Validate(): void

  ToJSON(): string

  ToObject(): Readonly<Record<string, JSONValue>>
}

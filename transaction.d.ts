export declare type TXType = string;

export declare const TX_TYPE_MASTER: TXType,
  TX_TYPE_ADDRESS: TXType,
  TX_TYPE_ADDRESSES: TXType,
  TX_TYPE_ACCOUNT: TXType,
  TX_TYPE_ACCOUNT_INITIAL_TXS: TXType,
  TX_TYPE_MESSAGE: TXType,
  TX_TYPE_MESSAGE_SENT: TXType,
  TX_TYPE_MESSAGE_THREAD_DELETE: TXType,
  TX_TYPE_TRANSFER: TXType,
  TX_TYPE_TRANSFER_CANCEL: TXType,
  TX_TYPE_TRANSFER_SENT: TXType,
  TX_TYPE_TRANSFER_RECEIVE_DELETE: TXType,
  TX_TYPE_TRANSFER_INFO: TXType,
  TX_TYPE_STORAGE: TXType,
  TX_TYPE_STORAGE_DELETE: TXType,
  TX_TYPE_BACKUP: TXType,
  TX_TYPE_CONTACT: TXType,
  TX_TYPE_FILE_VIRTUAL: TXType,
  TX_TYPE_FILE_FS: TXType,
  TX_TYPE_RFILE_VIRTUAL: TXType,
  TX_TYPE_RFILE_FS: TXType,
  TX_TYPE_DFILE_VIRTUAL: TXType,
  TX_TYPE_DFILE_FS: TXType,
  TX_TYPE_PFILE_VIRTUAL: TXType,
  TX_TYPE_REQUEST: TXType,
  TX_TYPE_REQUEST_IN: TXType,
  TX_TYPE_REQUEST_UPLOAD: TXType,
  TX_TYPE_REQUEST_CANCEL: TXType,
  TX_TYPE_DATA_ROOM: TXType,
  TX_TYPE_DATA_ROOMF: TXType,
  TX_TYPE_DATA_ROOM_POLICY: TXType,
  TX_TYPE_DATA_ROOM_DATA: TXType,
  TX_TYPE_DATA_ROOM_DATA_DELETE: TXType,
  TX_TYPE_DATA_ROOM_DATA_POLICY: TXType,
  TX_TYPE_MULTI_DATA_ROOM: TXType,
  TX_TYPE_MULTI_STORAGE: TXType,
  TX_TYPE_MULTI_TRANSFER: TXType,
  TX_TYPE_MULTI_TRANSFER_SENT: TXType,
  TX_TYPE_MULTI_BACKUP: TXType,
  TX_TYPE_MULTI_PASSWD: TXType,
  TX_TYPE_PASSWD_DATA: TXType,
  TX_TYPE_PASSWD_ROOM: TXType,
  TX_TYPE_PASSWD_ROOMF: TXType,
  TX_TYPE_PASSWD_ROOM_POLICY: TXType,
  TX_TYPE_PASSWD_ROOM_DATA: TXType,
  TX_TYPE_PASSWD_ROOM_DATA_DELETE: TXType,
  TX_TYPE_PASSWD_ROOM_DATA_POLICY: TXType,
  TX_TYPE_PASSWD_DATAV2: TXType,
  TX_TYPE_PASSWD_DATAV2_POLICY: TXType,
  TX_TYPE_COLLECTION: TXType,
  TX_TYPE_COLLECTION_POLICY: TXType;

export declare const TX_TYPE: Record<string, TXType>,
  TX_TYPE_LIST: TXType[];

export declare class Transaction {
  constructor(
    id: string,
    height: number,
    version: number,
    typ: TXType,
    sender_addr: string,
    recipient_addr: string,
    data: string,
    sign: string,
    fee: number,
    hash: string,
    inserted_at: Date,
  )
  get ID(): string;
  get Height(): number;
  get Version(): number;
  get Typ(): TXType;
  get SenderAddr(): string;
  get RecipientAddr(): string;
  get Data(): string;
  get Sign(): string;
  get Fee(): number;
  get Hash(): string;
  get InsertedAt(): Date;
  ToJSON(): string;
}

import { INVALID_ARGUMENT_WITH_CS } from './errors.js'
import { cloneAndFreeze, rfc3339Timestamp } from './validation.js'

export const TX_TYPE_MASTER = 'initial_storage',
  TX_TYPE_ADDRESS = 'interim_storage',
  TX_TYPE_ADDRESSES = 'interim_storages',
  TX_TYPE_ACCOUNT = 'initial_account',
  TX_TYPE_ACCOUNT_INITIAL_TXS = 'initial_account_txs',
  TX_TYPE_MESSAGE = 'message',
  TX_TYPE_MESSAGE_SENT = 'inherit_message',
  TX_TYPE_MESSAGE_THREAD_DELETE = 'inherit_message_recv',
  TX_TYPE_TRANSFER = 'transfer',
  TX_TYPE_TRANSFER_CANCEL = 'transfer_Cancel',
  TX_TYPE_TRANSFER_SENT = 'transfer_sent',
  TX_TYPE_TRANSFER_RECEIVE_DELETE = 'transfer_receive_delete',
  TX_TYPE_TRANSFER_INFO = 'transfer_info',
  TX_TYPE_STORAGE = 'storage',
  TX_TYPE_STORAGE_DELETE = 'storage_delete',
  TX_TYPE_BACKUP = 'backup',
  TX_TYPE_CONTACT = 'interim_message',
  TX_TYPE_FILE_VIRTUAL = 'fs_virt',
  TX_TYPE_FILE_FS = 'fs_real',
  TX_TYPE_RFILE_VIRTUAL = 'fs_rvirt',
  TX_TYPE_RFILE_FS = 'fs_rreal',
  TX_TYPE_DFILE_VIRTUAL = 'fs_dvirt',
  TX_TYPE_DFILE_FS = 'fs_dreal',
  TX_TYPE_PFILE_VIRTUAL = 'fs_pvirt',
  TX_TYPE_REQUEST = 'request',
  TX_TYPE_REQUEST_IN = 'request_in',
  TX_TYPE_REQUEST_UPLOAD = 'request_upload',
  TX_TYPE_REQUEST_CANCEL = 'request_Cancel',
  TX_TYPE_DATA_ROOM = 'data_room',
  TX_TYPE_DATA_ROOMF = 'data_roomF',
  TX_TYPE_DATA_ROOM_POLICY = 'data_room_policy',
  TX_TYPE_DATA_ROOM_DATA = 'data_room_data',
  TX_TYPE_DATA_ROOM_DATA_DELETE = 'data_room_data_delete',
  TX_TYPE_DATA_ROOM_DATA_POLICY = 'data_room_data_policy',
  TX_TYPE_DATA_ROOME = 'data_roomE',
  TX_TYPE_DATA_ROOME_DATA = 'data_roomE_data',
  TX_TYPE_MULTI_DATA_ROOM = 'multi_data_room',
  TX_TYPE_MULTI_STORAGE = 'multi_storage',
  TX_TYPE_MULTI_TRANSFER = 'multi_transfer',
  TX_TYPE_MULTI_TRANSFER_SENT = 'multi_transfer_sent',
  TX_TYPE_MULTI_BACKUP = 'multi_backup',
  TX_TYPE_MULTI_PASSWD = 'multi_passwd',
  TX_TYPE_MULTI_COLLECTION = 'multi_collection',
  TX_TYPE_MULTI_DATAV2 = 'multi_dataV2',
  TX_TYPE_PASSWD_DATA = 'passwd_data',
  TX_TYPE_PASSWD_ROOM = 'passwd_room',
  TX_TYPE_PASSWD_ROOMF = 'passwd_roomF',
  TX_TYPE_PASSWD_ROOM_POLICY = 'passwd_room_policy',
  TX_TYPE_PASSWD_ROOM_DATA = 'passwd_room_data',
  TX_TYPE_PASSWD_ROOM_DATA_DELETE = 'passwd_room_data_delete',
  TX_TYPE_PASSWD_ROOM_DATA_POLICY = 'passwd_room_data_policy',
  TX_TYPE_DATAV2 = 'datav2',
  TX_TYPE_DATAV2_POLICY = 'datav2_policy',
  TX_TYPE_COLLECTION = 'coll',
  TX_TYPE_COLLECTION_POLICY = 'coll_policy',
  TX_TYPE_DATAV2_COLLECTION = 'datav2_coll',
  TX_TYPE_DATAV2F = 'datav2F',
  /** @type {ReadonlyArray<import('./transaction.js').TXType>} */
  TX_TYPE_LIST = Object.freeze([
    TX_TYPE_MASTER,
    TX_TYPE_ADDRESS,
    TX_TYPE_ADDRESSES,
    TX_TYPE_ACCOUNT,
    TX_TYPE_ACCOUNT_INITIAL_TXS,
    TX_TYPE_MESSAGE,
    TX_TYPE_MESSAGE_SENT,
    TX_TYPE_MESSAGE_THREAD_DELETE,
    TX_TYPE_TRANSFER,
    TX_TYPE_TRANSFER_CANCEL,
    TX_TYPE_TRANSFER_SENT,
    TX_TYPE_TRANSFER_RECEIVE_DELETE,
    TX_TYPE_TRANSFER_INFO,
    TX_TYPE_STORAGE,
    TX_TYPE_STORAGE_DELETE,
    TX_TYPE_BACKUP,
    TX_TYPE_CONTACT,
    TX_TYPE_FILE_VIRTUAL,
    TX_TYPE_FILE_FS,
    TX_TYPE_RFILE_VIRTUAL,
    TX_TYPE_RFILE_FS,
    TX_TYPE_DFILE_VIRTUAL,
    TX_TYPE_DFILE_FS,
    TX_TYPE_PFILE_VIRTUAL,
    TX_TYPE_REQUEST,
    TX_TYPE_REQUEST_IN,
    TX_TYPE_REQUEST_UPLOAD,
    TX_TYPE_REQUEST_CANCEL,
    TX_TYPE_DATA_ROOM,
    TX_TYPE_DATA_ROOMF,
    TX_TYPE_DATA_ROOM_POLICY,
    TX_TYPE_DATA_ROOM_DATA,
    TX_TYPE_DATA_ROOM_DATA_DELETE,
    TX_TYPE_DATA_ROOM_DATA_POLICY,
    TX_TYPE_DATA_ROOME,
    TX_TYPE_DATA_ROOME_DATA,
    TX_TYPE_MULTI_DATA_ROOM,
    TX_TYPE_MULTI_STORAGE,
    TX_TYPE_MULTI_TRANSFER,
    TX_TYPE_MULTI_TRANSFER_SENT,
    TX_TYPE_MULTI_BACKUP,
    TX_TYPE_MULTI_PASSWD,
    TX_TYPE_MULTI_COLLECTION,
    TX_TYPE_MULTI_DATAV2,
    TX_TYPE_PASSWD_DATA,
    TX_TYPE_PASSWD_ROOM,
    TX_TYPE_PASSWD_ROOMF,
    TX_TYPE_PASSWD_ROOM_POLICY,
    TX_TYPE_PASSWD_ROOM_DATA,
    TX_TYPE_PASSWD_ROOM_DATA_DELETE,
    TX_TYPE_PASSWD_ROOM_DATA_POLICY,
    TX_TYPE_DATAV2,
    TX_TYPE_DATAV2_POLICY,
    TX_TYPE_COLLECTION,
    TX_TYPE_COLLECTION_POLICY,
    TX_TYPE_DATAV2_COLLECTION,
    TX_TYPE_DATAV2F
  ])

export class Transaction {
  _order
  _id
  _identifier
  _height
  _version
  _typ
  _sender_addr
  _recipient_addr
  _data
  _additionalData
  _cipherData
  _sign
  _fee
  _hash
  _inserted_at
  _chainName
  _chainVersion

  /**
   * @param {string} id
   * @param {number} height
   * @param {number} version
   * @param {string} typ
   * @param {string} sender_addr
   * @param {string} recipient_addr
   * @param {string} data
   * @param {string} sign
   * @param {number} fee
   * @param {string} hash
   * @param {string|number|Date} [inserted_at] Date text/RFC3339Nano, Unix milliseconds or Date.
   * @param {?string} additionalData
   * @param {?string} cipherData
   * @param {?string} chainName
   * @param {?string} chainVersion
   * @throws Error
   */
  constructor({
    id,
    height,
    version,
    typ,
    sender_addr,
    recipient_addr,
    data,
    sign,
    fee,
    hash,
    inserted_at,
    additionalData = null,
    cipherData = null,
    chainName = null,
    chainVersion = null
  } = {}) {
    this._id = id
    this._height = height
    this._version = version
    this._typ = typ
    this._sender_addr = sender_addr
    this._recipient_addr = recipient_addr
    this._data = data
    this._sign = sign
    this._fee = fee
    this._hash = hash
    this._inserted_at =
      typeof inserted_at === 'undefined'
        ? undefined
        : rfc3339Timestamp(inserted_at)

    if (additionalData) this._additionalData = additionalData

    if (cipherData) this._cipherData = cipherData

    if (chainName) this._chainName = chainName

    if (chainVersion) this._chainVersion = chainVersion
  }

  get Order() {
    return this._order
  }

  get ID() {
    return this._id
  }

  get Height() {
    return this._height
  }

  get Version() {
    return this._version
  }

  get Typ() {
    return this._typ
  }

  get SenderAddr() {
    return this._sender_addr
  }

  get RecipientAddr() {
    return this._recipient_addr
  }

  /** @returns {import('./types.js').JSONValue} Factory data is a deeply frozen snapshot. */
  get Data() {
    return this._data
  }

  /** @returns {import('./types.js').JSONValue|undefined} Factory data is a deeply frozen snapshot. */
  get AdditionalData() {
    return this._additionalData
  }

  /** @returns {import('./types.js').JSONValue|undefined} Factory data is a deeply frozen snapshot. */
  get CipherData() {
    return this._cipherData
  }

  get Sign() {
    return this._sign
  }

  get Fee() {
    return this._fee
  }

  get Hash() {
    return this._hash
  }

  /** @returns {Date|undefined} Detached Date converted from date text or Unix milliseconds. */
  get InsertedAt() {
    return typeof this._inserted_at !== 'undefined'
      ? new Date(this._inserted_at)
      : undefined
  }

  get ChainName() {
    return this._chainName
  }

  get ChainVersion() {
    return this._chainVersion
  }

  /** @param {string} value @returns {import('./types.js').ParseResult<'transaction', Readonly<Transaction>>} */
  static FromJSON(value) {
    if (typeof value !== 'string')
      return { transaction: null, error: new Error('Invalid transaction JSON') }

    try {
      return Transaction.FromObject(JSON.parse(value))
    } catch {
      return { transaction: null, error: new Error('Invalid transaction JSON') }
    }
  }

  /** @param {Record<string, unknown>} obj @returns {import('./types.js').ParseResult<'transaction', Readonly<Transaction>>} */
  static FromObject(obj) {
    if (!obj)
      return {
        transaction: null,
        error: new Error('invalid obj payload')
      }

    try {
      const tx = new Transaction()

      if (typeof obj.order !== 'undefined') tx._order = obj.order

      tx._id = obj.id
      tx._typ = obj.typ

      if (typeof obj.identifier !== 'undefined')
        tx._identifier = cloneAndFreeze(obj.identifier)

      tx._height = obj.height
      tx._version = obj.version
      tx._sender_addr = obj.sender_addr
      tx._recipient_addr = obj.recipient_addr
      tx._data = cloneAndFreeze(obj.data)

      if (typeof obj.additional_data !== 'undefined')
        tx._additionalData = cloneAndFreeze(obj.additional_data)

      if (typeof obj.cipher_data !== 'undefined')
        tx._cipherData = cloneAndFreeze(obj.cipher_data)

      tx._sign = obj.sign
      tx._fee = obj.fee
      tx._hash = obj.hash

      if (typeof obj.inserted_at !== 'undefined')
        tx._inserted_at = rfc3339Timestamp(obj.inserted_at)

      if (typeof obj.chain_name !== 'undefined') tx._chainName = obj.chain_name

      if (typeof obj.chain_version !== 'undefined')
        tx._chainVersion = obj.chain_version

      tx.Validate()

      return { transaction: Object.freeze(tx), error: null }
    } catch {
      return {
        transaction: null,
        error: new Error('Invalid transaction payload')
      }
    }
  }

  /**
   * @return {string}
   * @throws Error
   */
  ToJSON() {
    this.Validate()

    return JSON.stringify({
      id: this._id,
      height: this._height,
      version: this._version,
      typ: this._typ,
      sender_addr: this._sender_addr,
      recipient_addr: this._recipient_addr,
      data: this._data,
      sign: this._sign,
      fee: this._fee,
      ...(typeof this._hash !== 'undefined' ? { hash: this._hash } : {}),
      ...(typeof this._inserted_at !== 'undefined'
        ? { inserted_at: new Date(this._inserted_at).toISOString() }
        : {}),
      ...(this._additionalData
        ? { additional_data: this._additionalData }
        : {}),
      ...(this._cipherData ? { cipher_data: this._cipherData } : {}),
      ...(this._chainName ? { chain_name: this._chainName } : {}),
      ...(this._chainVersion ? { chain_version: this._chainVersion } : {})
    })
  }

  /**
   * @return {Readonly<Record<string, import('./types.js').JSONValue>>} Deeply frozen JSON snapshot.
   * @throws Error
   */
  ToObject() {
    this.Validate()

    return cloneAndFreeze({
      id: this._id,
      height: this._height,
      version: this._version,
      typ: this._typ,
      sender_addr: this._sender_addr,
      recipient_addr: this._recipient_addr,
      data: this._data,
      sign: this._sign,
      fee: this._fee,
      ...(typeof this._hash !== 'undefined' ? { hash: this._hash } : {}),
      ...(typeof this._inserted_at !== 'undefined'
        ? { inserted_at: new Date(this._inserted_at).toISOString() }
        : {}),
      ...(this._additionalData
        ? { additional_data: this._additionalData }
        : {}),
      ...(this._cipherData ? { cipher_data: this._cipherData } : {}),
      ...(this._chainName ? { chain_name: this._chainName } : {}),
      ...(this._chainVersion ? { chain_version: this._chainVersion } : {})
    })
  }

  Validate() {
    if (
      typeof this._order !== 'undefined' &&
      (!Number.isSafeInteger(this._order) || this._order < 0)
    )
      throw new Error(INVALID_ARGUMENT_WITH_CS('order'))

    if (typeof this._hash !== 'undefined' && typeof this._hash !== 'string')
      throw new Error(INVALID_ARGUMENT_WITH_CS('hash'))

    if (typeof this._id !== 'string' || !this._id.length)
      throw new Error(INVALID_ARGUMENT_WITH_CS('id'))

    if (!Number.isSafeInteger(this._height) || this._height < 0)
      throw new Error(INVALID_ARGUMENT_WITH_CS('height'))

    if (!Number.isSafeInteger(this._version) || this._version < 0)
      throw new Error(INVALID_ARGUMENT_WITH_CS('version'))

    if (typeof this._typ !== 'string')
      throw new Error(INVALID_ARGUMENT_WITH_CS('typ'))

    if (!TX_TYPE_LIST.includes(this._typ))
      throw new Error(INVALID_ARGUMENT_WITH_CS('typ'))

    if (
      typeof this._sender_addr !== 'string' ||
      !this._sender_addr.length ||
      this._sender_addr.length > 2048
    )
      throw new Error(INVALID_ARGUMENT_WITH_CS('senderAddr'))

    if (
      typeof this._recipient_addr !== 'string' ||
      !this._recipient_addr.length ||
      this._recipient_addr.length > 2048
    )
      throw new Error(INVALID_ARGUMENT_WITH_CS('recipientAddr'))

    if (typeof this._data === 'undefined')
      throw new Error(INVALID_ARGUMENT_WITH_CS('data'))

    if (typeof this._sign !== 'string' || !this._sign.length)
      throw new Error(INVALID_ARGUMENT_WITH_CS('sign'))

    if (!Number.isFinite(this._fee) || this._fee < 0)
      throw new Error(INVALID_ARGUMENT_WITH_CS('fee'))

    if (
      typeof this._inserted_at !== 'undefined' &&
      !Number.isFinite(this._inserted_at)
    )
      throw new Error(INVALID_ARGUMENT_WITH_CS('insertedAt'))

    if (
      typeof this._chainName !== 'undefined' &&
      typeof this._chainName !== 'string'
    )
      throw new Error(INVALID_ARGUMENT_WITH_CS('chainName'))

    if (
      typeof this._chainVersion !== 'undefined' &&
      typeof this._chainVersion !== 'string'
    )
      throw new Error(INVALID_ARGUMENT_WITH_CS('chainVersion'))
  }
}

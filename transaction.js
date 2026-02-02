import { INVALID_ARGUMENT_WITH_CS } from './errors.js'

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
  TX_TYPE_MULTI_DATA_ROOM = 'multi_data_room',
  TX_TYPE_MULTI_STORAGE = 'multi_storage',
  TX_TYPE_MULTI_TRANSFER = 'multi_transfer',
  TX_TYPE_MULTI_TRANSFER_SENT = 'multi_transfer_sent',
  TX_TYPE_MULTI_BACKUP = 'multi_backup',
  TX_TYPE_MULTI_PASSWD = 'multi_passwd',
  TX_TYPE_PASSWD_DATA = 'passwd_data',
  TX_TYPE_PASSWD_ROOM = 'passwd_room',
  TX_TYPE_PASSWD_ROOMF = 'passwd_roomF',
  TX_TYPE_PASSWD_ROOM_POLICY = 'passwd_room_policy',
  TX_TYPE_PASSWD_ROOM_DATA = 'passwd_room_data',
  TX_TYPE_PASSWD_ROOM_DATA_DELETE = 'passwd_room_data_delete',
  TX_TYPE_PASSWD_ROOM_DATA_POLICY = 'passwd_room_data_policy',
  TX_TYPE_PASSWD_DATAV2 = 'pwdd',
  TX_TYPE_PASSWD_DATAV2_POLICY = 'pwdd_policy',
  TX_TYPE_COLLECTION = 'coll',
  TX_TYPE_COLLECTION_POLICY = 'coll_policy',
  TX_TYPE_LIST = [
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
    TX_TYPE_MULTI_DATA_ROOM,
    TX_TYPE_MULTI_STORAGE,
    TX_TYPE_MULTI_TRANSFER,
    TX_TYPE_MULTI_TRANSFER_SENT,
    TX_TYPE_MULTI_BACKUP,
    TX_TYPE_MULTI_PASSWD,
    TX_TYPE_PASSWD_DATA,
    TX_TYPE_PASSWD_ROOM,
    TX_TYPE_PASSWD_ROOMF,
    TX_TYPE_PASSWD_ROOM_POLICY,
    TX_TYPE_PASSWD_ROOM_DATA,
    TX_TYPE_PASSWD_ROOM_DATA_DELETE,
    TX_TYPE_PASSWD_ROOM_DATA_POLICY,
    TX_TYPE_PASSWD_DATAV2,
    TX_TYPE_PASSWD_DATAV2_POLICY,
    TX_TYPE_COLLECTION,
    TX_TYPE_COLLECTION_POLICY,
  ]

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
   * @param {Date} inserted_at
   * @param {?string} additionalData
   * @param {?string} cipherData
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
    this._inserted_at = inserted_at
    if (additionalData) this._additionalData = additionalData
    if (cipherData) this._cipherData = cipherData
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

  get Data() {
    return this._data
  }

  get AdditionalData() {
    return this._additionalData
  }

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

  get InsertedAt() {
    return this._inserted_at
  }

  static FromJSON(value) {
    try {
      const parsed = JSON.parse(value),
        tx = new Transaction()

      if (parsed.order) tx._order = parsed.order
      tx._id = parsed.id
      if (parsed.identifier) tx._identifier = parsed.identifier
      tx._height = parsed.height
      tx._version = parsed.version
      tx._sender_addr = parsed.sender_addr
      tx._recipient_addr = parsed.recipient_addr
      tx._data = parsed.data
      if (parsed.additional_data) tx._additionalData = parsed.additional_data
      if (parsed.cipher_data) tx._cipherData = parsed.cipher_data
      tx._sign = parsed.sign
      tx._fee = parsed.fee
      tx._hash = parsed.hash
      tx._inserted_at = new Date(parsed.inserted_at)

      return { transaction: tx, error: null }
    } catch (e) {
      return { transaction: null, error: e }
    }
  }

  static FromObject(obj) {
    try {
      const tx = new Transaction()

      if (obj.order) tx._order = obj.order
      tx._id = obj.id
      if (obj.identifier) tx._identifier = obj.identifier
      tx._height = obj.height
      tx._version = obj.version
      tx._sender_addr = obj.sender_addr
      tx._recipient_addr = obj.recipient_addr
      tx._data = obj.data
      if (obj.additional_data) tx._additionalData = obj.additional_data
      if (obj.cipher_data) tx._cipherData = obj.cipher_data
      tx._sign = obj.sign
      tx._fee = obj.fee
      tx._hash = obj.hash
      tx._inserted_at = new Date(obj.inserted_at)

      return { transaction: tx, error: null }
    } catch (e) {
      return { transaction: null, error: e }
    }
  }

  /**
   * @return {string}
   * @throws Error
   */
  ToJSON() {
    this._validate()

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
      hash: this._hash,
      inserted_at: this._inserted_at.toISOString(),
      ...(this._additionalData
        ? { additional_data: this._additionalData }
        : {}),
      ...(this._cipherData ? { cipher_data: this._cipherData } : {}),
    })
  }

  Validate() {
    if (typeof this._id === 'undefined')
      throw new Error(INVALID_ARGUMENT_WITH_CS('id'))
    if (typeof this._height !== 'number')
      throw new Error(INVALID_ARGUMENT_WITH_CS('height'))
    if (typeof this._version !== 'number')
      throw new Error(INVALID_ARGUMENT_WITH_CS('version'))
    if (typeof this._typ !== 'string')
      throw new Error(INVALID_ARGUMENT_WITH_CS('typ'))
    if (!TX_TYPE_LIST.includes(this._typ))
      throw new Error(INVALID_ARGUMENT_WITH_CS('typ'))
    if (typeof this._sender_addr !== 'string')
      throw new Error(INVALID_ARGUMENT_WITH_CS('senderAddr'))
    if (typeof this._recipient_addr !== 'string')
      throw new Error(INVALID_ARGUMENT_WITH_CS('recipientAddr'))
    if (typeof this._data !== 'string')
      throw new Error(INVALID_ARGUMENT_WITH_CS('data'))
    if (
      typeof this._additionalData !== 'undefined' &&
      typeof this._additionalData !== 'string'
    )
      throw new Error(INVALID_ARGUMENT_WITH_CS('additionalData'))
    if (
      typeof this._cipherData !== 'undefined' &&
      typeof this._cipherData !== 'string'
    )
      throw new Error(INVALID_ARGUMENT_WITH_CS('cipherData'))
    if (typeof this._sign !== 'object')
      throw new Error(INVALID_ARGUMENT_WITH_CS('sign'))
    if (typeof this._fee !== 'number')
      throw new Error(INVALID_ARGUMENT_WITH_CS('fee'))
    if (!(this._inserted_at instanceof Date))
      throw new Error(INVALID_ARGUMENT_WITH_CS('insertedAt'))
  }
}

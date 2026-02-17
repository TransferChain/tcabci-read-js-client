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
   * @param {Date} inserted_at
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
    chainVersion = null,
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

  get ChainName() {
    return this._chainName
  }

  get ChainVersion() {
    return this._chainVersion
  }

  static FromJSON(value) {
    if (typeof value !== 'string')
      return {
        transaction: null,
        error: new Error('invalid json payload'),
      }

    try {
      const parsed = JSON.parse(value),
        tx = new Transaction()

      if (typeof parsed.order !== 'undefined') tx._order = parsed.order
      tx._id = parsed.id
      tx._typ = parsed.typ
      if (typeof parsed.identifier !== 'undefined')
        tx._identifier = parsed.identifier
      tx._height = parsed.height
      tx._version = parsed.version
      tx._sender_addr = parsed.sender_addr
      tx._recipient_addr = parsed.recipient_addr
      tx._data = parsed.data
      if (typeof parsed.additional_data !== 'undefined')
        tx._additionalData = parsed.additional_data
      if (typeof parsed.cipher_data !== 'undefined')
        tx._cipherData = parsed.cipher_data
      tx._sign = parsed.sign
      tx._fee = parsed.fee
      tx._hash = parsed.hash
      if (typeof parsed.inserted_at !== 'undefined')
        tx._inserted_at = new Date(parsed.inserted_at)
      if (typeof parsed.chain_name !== 'undefined')
        this._chainName = parsed.chain_name
      if (typeof parsed.chain_version !== 'undefined')
        this._chainVersion = parsed.chain_version

      return { transaction: tx, error: null }
    } catch (e) {
      return { transaction: null, error: e }
    }
  }

  static FromObject(obj) {
    if (!obj)
      return {
        transaction: null,
        error: new Error('invalid obj payload'),
      }

    try {
      const tx = new Transaction()

      if (typeof obj.order !== 'undefined') tx._order = obj.order
      tx._id = obj.id
      tx._typ = obj.typ
      if (typeof obj.identifier !== 'undefined') tx._identifier = obj.identifier
      tx._height = obj.height
      tx._version = obj.version
      tx._sender_addr = obj.sender_addr
      tx._recipient_addr = obj.recipient_addr
      tx._data = obj.data
      if (typeof obj.additional_data !== 'undefined')
        tx._additionalData = obj.additional_data
      if (typeof obj.cipher_data !== 'undefined')
        tx._cipherData = obj.cipher_data
      tx._sign = obj.sign
      tx._fee = obj.fee
      tx._hash = obj.hash
      if (typeof obj.inserted_at !== 'undefined')
        tx._inserted_at = new Date(obj.inserted_at)
      if (typeof obj.chain_name !== 'undefined')
        this._chainName = obj.chain_name
      if (typeof obj.chain_version !== 'undefined')
        this._chainVersion = obj.chain_version

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
      hash: this._hash,
      ...(this._inserted_at
        ? { inserted_at: this._inserted_at.toISOString() }
        : {}),
      ...(this._additionalData
        ? { additional_data: this._additionalData }
        : {}),
      ...(this._cipherData ? { cipher_data: this._cipherData } : {}),
      ...(this._chainName ? { chain_name: this._chainName } : {}),
      ...(this._chainVersion ? { chain_version: this._chainVersion } : {}),
    })
  }

  /**
   * @return {Object<string, *>}
   * @throws Error
   */
  ToObject() {
    this.Validate()

    return {
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
      ...(this._inserted_at
        ? { inserted_at: this._inserted_at.toISOString() }
        : {}),
      ...(this._additionalData
        ? { additional_data: this._additionalData }
        : {}),
      ...(this._cipherData ? { cipher_data: this._cipherData } : {}),
      ...(this._chainName ? { chain_name: this._chainName } : {}),
      ...(this._chainVersion ? { chain_version: this._chainVersion } : {}),
    }
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
    if (typeof this._data === 'undefined')
      throw new Error(INVALID_ARGUMENT_WITH_CS('data'))
    if (typeof this._sign === 'undefined')
      throw new Error(INVALID_ARGUMENT_WITH_CS('sign'))
    if (typeof this._fee !== 'number')
      throw new Error(INVALID_ARGUMENT_WITH_CS('fee'))
    if (this._inserted_at && !(this._inserted_at instanceof Date))
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

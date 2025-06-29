import { INVALID_ARGUMENT_WITH_CS } from './errors.js'

export default class Transaction {
  _id
  _block_id
  _height
  _identifier
  _version
  _typ
  _sender_addr
  _recipient_addr
  _data
  _sign
  _fee
  _hash
  _inserted_at

  constructor({
    id,
    block_id,
    height,
    identifier,
    version,
    typ,
    sender_addr,
    recipient_addr,
    data,
    sign,
    fee,
    hash,
    inserted_at,
  }) {
    this._id = id
    this._block_id = block_id
    this._height = height
    this._identifier = identifier
    this._version = version
    this._typ = typ
    this._sender_addr = sender_addr
    this._recipient_addr = recipient_addr
    this._data = data
    this._sign = sign
    this._fee = fee
    this._hash = hash
    this._inserted_at = inserted_at
  }

  ToJSON() {
    this._validate()

    return JSON.stringify({
      id: this._id,
      block_id: this._block_id,
      height: this._height,
      identifier: this._identifier,
      version: this._version,
      typ: this._typ,
      sender_addr: this._sender_addr,
      recipient_addr: this._recipient_addr,
      data: this._data,
      sign: this._sign,
      fee: this._fee,
      hash: this._hash,
      inserted_at: this._inserted_at,
    })
  }

  _validate() {
    if (typeof this._id !== 'number') {
      throw new Error(INVALID_ARGUMENT_WITH_CS('id'))
    }
    if (typeof this._block_id !== 'number') {
      throw new Error(INVALID_ARGUMENT_WITH_CS('blockID'))
    }
    if (typeof this._height !== 'number') {
      throw new Error(INVALID_ARGUMENT_WITH_CS('height'))
    }
    if (typeof this._identifier !== 'string') {
      throw new Error(INVALID_ARGUMENT_WITH_CS('identifier'))
    }
    if (typeof this._version !== 'number') {
      throw new Error(INVALID_ARGUMENT_WITH_CS('version'))
    }
    if (typeof this._typ !== 'string') {
      throw new Error(INVALID_ARGUMENT_WITH_CS('typ'))
    }
    if (typeof this._sender_addr !== 'string') {
      throw new Error(INVALID_ARGUMENT_WITH_CS('senderAddr'))
    }
    if (typeof this._recipient_addr !== 'string') {
      throw new Error(INVALID_ARGUMENT_WITH_CS('recipientAddr'))
    }
    if (typeof this._data !== 'object') {
      throw new Error(INVALID_ARGUMENT_WITH_CS('data'))
    }
    if (typeof this._sign !== 'object') {
      throw new Error(INVALID_ARGUMENT_WITH_CS('sign'))
    }
    if (typeof this._fee !== 'number') {
      throw new Error(INVALID_ARGUMENT_WITH_CS('fee'))
    }
    if (typeof this._inserted_at !== 'string') {
      throw new Error(INVALID_ARGUMENT_WITH_CS('insertedAt'))
    }
  }
}

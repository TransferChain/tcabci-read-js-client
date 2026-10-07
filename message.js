import { SendThrow } from './util.js'
import { INVALID_ARGUMENT_WITH_CS } from './errors.js'
import { TX_TYPE_LIST } from './transaction.js'
import {
  addresses,
  signedData as validateSignedData,
  cloneAndFreeze
} from './validation.js'

export const SUBSCRIBEMessage = 'subscribe',
  UNSUBSCRIBEMessage = 'unsubscribe',
  Block = 0,
  Transaction = 1,
  Subscription = 2,
  Listen = 3,
  MSG = 4,
  OK = 1,
  FAIL = 2

export default class Message {
  _is_web = false
  _type
  _addresses
  _signedAddresses
  _txTypes
  _data
  _state

  /**
   * @param {boolean} isWeb
   * @param {string|number} type
   * @param {Array<string>} addrs
   * @param {?Object} signedData
   * @param {?Array<string>} txTypes
   * @param {*} data
   */
  constructor({
    isWeb,
    type,
    addrs,
    signedData = null,
    txTypes = null,
    data = null
  } = {}) {
    this._is_web = isWeb
    this._type = type

    if (addrs && Array.isArray(addrs))
      this._addresses = Object.freeze(addresses(addrs))

    if (signedData !== null) this._signedAddresses = cloneAndFreeze(signedData)

    if (txTypes && Array.isArray(txTypes))
      this._txTypes = Object.freeze([...txTypes])

    if (data !== null) this._data = cloneAndFreeze(data)
  }

  get IsWeb() {
    return this._is_web
  }

  get Type() {
    return this._type
  }

  /** @returns {ReadonlyArray<string>|undefined} Frozen snapshot when present. */
  get Addresses() {
    return this._addresses
  }

  /** @returns {Readonly<Record<string, string>>|undefined} Frozen snapshot when present. */
  get SignedAddresses() {
    return this._signedAddresses
  }

  /** @returns {ReadonlyArray<import('./transaction.js').TXType>|undefined} Frozen snapshot when present. */
  get TXTypes() {
    return this._txTypes
  }

  /** @returns {import('./types.js').JSONValue|undefined} Frozen snapshot when present. */
  get Data() {
    return this._data
  }

  get State() {
    return this._state
  }

  /** @param {string} value @returns {import('./types.js').ParseResult<'message', Readonly<Message>>} */
  static FromJSON(value) {
    if (typeof value !== 'string')
      return { message: null, error: new Error('Invalid message JSON') }

    try {
      return Message.FromObject(JSON.parse(value))
    } catch {
      return { message: null, error: new Error('Invalid message JSON') }
    }
  }

  /** @param {Record<string, unknown>} obj @returns {import('./types.js').ParseResult<'message', Readonly<Message>>} */
  static FromObject(obj) {
    try {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj))
        SendThrow(new TypeError('Invalid message'))

      const msg = new Message()

      msg._type = obj.type

      if (typeof obj.is_web !== 'undefined') msg._is_web = obj.is_web

      if (typeof obj.addresses !== 'undefined')
        msg._addresses = Object.freeze(addresses(obj.addresses))

      if (typeof obj.signed_addresses !== 'undefined')
        msg._signedAddresses = Object.freeze(
          validateSignedData(obj.signed_addresses)
        )

      if (typeof obj.data !== 'undefined') msg._data = cloneAndFreeze(obj.data)

      if (typeof obj.tx_types !== 'undefined')
        msg._txTypes = cloneAndFreeze(obj.tx_types)

      if (typeof obj.state !== 'undefined') msg._state = obj.state

      msg._validate()

      return { message: Object.freeze(msg), error: null }
    } catch {
      return { message: null, error: new Error('Invalid message payload') }
    }
  }

  ToJSON() {
    this._validate()

    return JSON.stringify({
      is_web: this._is_web,
      type: this._type,
      ...(this._addresses ? { addresses: this._addresses } : {}),
      ...(this._signedAddresses
        ? { signed_addresses: this._signedAddresses }
        : {}),
      ...(this._txTypes ? { tx_types: this._txTypes } : {}),
      ...(typeof this._data !== 'undefined' ? { data: this._data } : {}),
      ...(typeof this._state !== 'undefined' ? { state: this._state } : {})
    })
  }

  _validate() {
    if (
      typeof this._is_web !== 'undefined' &&
      typeof this._is_web !== 'boolean'
    ) {
      throw new Error(INVALID_ARGUMENT_WITH_CS('is_web'))
    }

    if (
      ![
        SUBSCRIBEMessage,
        UNSUBSCRIBEMessage,
        Block,
        Transaction,
        Subscription,
        Listen,
        MSG
      ].includes(this._type)
    )
      throw new Error(INVALID_ARGUMENT_WITH_CS('type'))

    if (
      typeof this._addresses !== 'undefined' &&
      !Array.isArray(this._addresses)
    ) {
      throw new Error(INVALID_ARGUMENT_WITH_CS('addresses'))
    }

    if (
      typeof this._signedAddresses !== 'undefined' &&
      typeof this._signedAddresses !== 'object'
    ) {
      throw new Error(INVALID_ARGUMENT_WITH_CS('signedAddresses'))
    }

    if (typeof this._txTypes !== 'undefined') {
      if (
        !Array.isArray(this._txTypes) ||
        this._txTypes.length > TX_TYPE_LIST.length
      )
        throw new Error(INVALID_ARGUMENT_WITH_CS('tx_types'))

      for (let i = 0; i < this._txTypes.length; i++) {
        if (!TX_TYPE_LIST.includes(this._txTypes[i])) {
          throw new Error(INVALID_ARGUMENT_WITH_CS('tx_types'))
        }
      }
    }

    if (
      typeof this._state !== 'undefined' &&
      ![OK, FAIL].includes(this._state)
    ) {
      throw new Error(INVALID_ARGUMENT_WITH_CS('state'))
    }
  }
}

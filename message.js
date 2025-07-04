import { INVALID_ARGUMENTS, INVALID_ARGUMENT_WITH_CS } from './errors.js'
import { MESSAGE_TYPE, TX_TYPE } from './constants.js'

export default class Message {
  _is_web = false
  _type = ''
  _addrs = []
  _signedData = {}
  _txTypes = []

  /**
   * @param {boolean} isWeb
   * @param {string} type
   * @param {Array<string>} addrs
   * @param {?Object} signedData
   * @param {?Array<string>} txTypes
   */
  constructor(isWeb, type, addrs, signedData = null, txTypes = null) {
    this._is_web = isWeb
    this._type = type
    if (addrs && Array.isArray(addrs)) this._addrs = addrs
    if (typeof signedData === 'object') this._signedData = signedData
    if (txTypes && Array.isArray(txTypes)) this._txTypes = txTypes
  }

  ToJSON() {
    this._validate()

    return JSON.stringify({
      is_web: this._is_web,
      type: this._type,
      addrs: this._addrs,
      signed_addrs: this._signedData,
      ...(this._txTypes.length > 0 ? { tx_types: this._txTypes } : {}),
    })
  }

  _validate() {
    if (typeof this._is_web !== 'boolean') {
      throw new Error(INVALID_ARGUMENT_WITH_CS('is_web'))
    }

    if (typeof this._type !== 'string') {
      throw new Error(INVALID_ARGUMENT_WITH_CS('type'))
    }

    if (!Array.isArray(this._addrs)) {
      throw new Error(INVALID_ARGUMENT_WITH_CS('addrs'))
    }

    if (typeof this._signedData !== 'object') {
      throw new Error(INVALID_ARGUMENT_WITH_CS('signedData'))
    }

    if (
      [MESSAGE_TYPE.SUBSCRIBE, MESSAGE_TYPE.UNSUBSCRIBE].indexOf(this._type) ===
      -1
    ) {
      throw new Error(INVALID_ARGUMENTS)
    }

    if (this._txTypes.length) {
      let vals = Object.values(TX_TYPE)

      for (let i = 0; i < this._txTypes.length; i++) {
        if (vals.indexOf(this._txTypes[i]) === -1) {
          throw new Error(INVALID_ARGUMENT_WITH_CS('tx_types'))
        }
      }

      vals = []
    }
  }
}

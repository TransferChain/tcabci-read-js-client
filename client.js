import ReconnectingWebSocket from 'reconnecting-websocket'
import {
  ADDRESSES_IS_EMPTY,
  ALREADY_CONNECTED,
  BLOCK_NOT_FOUND,
  ERR_NETWORK,
  FetchError,
  INVALID_ARGUMENTS,
  NOT_CONNECTED,
  NOT_SUBSCRIBED,
  TRANSACTION_NOT_BROADCAST,
  TRANSACTION_TYPE_NOT_VALID,
} from './errors.js'
import {
  MESSAGE_TYPE,
  READ_NODE_ADDRESS,
  READ_NODE_WS_ADDRESS,
  TX_TYPE,
} from './constants.js'
import Message from './message.js'
import { toJSON } from './util.js'


/**
 * @callback successCallback
 * @param {Event} event
 * @return void
 */
/**
 * @callback errorCallback
 * @param {Event} event
 * @return void
 */
/**
 * @callback closeCallback
 * @param {Event} event
 * @return void
 */
/**
 * @callback listenCallback
 * @param {*} message
 * @return void
 */
export default class TCaBCIClient {
  subscribed = false
  subscribedAddresses = []
  connected = false
  version = 'v2.1.5'
  /**
   * @type {?successCallback}
   */
  successCb = null
  /**
   * @type {?errorCallback}
   */
  errorCb = null
  /**
   * @type {?closeCallback}
   */
  closeCb = null
  /**
   * @type {?listenCallback}
   */
  listenCb = null
  wsLibrary = null
  ws = null
  readNodeAddress = READ_NODE_ADDRESS
  readNodeWSAddress = READ_NODE_WS_ADDRESS

  /**
   * @param {Array<String>} readNodeAddresses
   * @param {WebSocket} wsLibrary
   */
  constructor(readNodeAddresses = [], wsLibrary) {
    if (!wsLibrary) throw INVALID_ARGUMENTS
    this.wsLibrary = wsLibrary

    if (Array.isArray(readNodeAddresses) && readNodeAddresses.length === 2) {
      this.readNodeAddress = readNodeAddresses[0]
      this.readNodeWSAddress = readNodeAddresses[1]

      if (!readNodeAddresses[0].startsWith('http')) throw INVALID_ARGUMENTS
      if (!readNodeAddresses[1].startsWith('ws')) throw INVALID_ARGUMENTS
    }
  }

  /**
   * @param {string} uri
   * @param {RequestInit} req
   * @return {Promise<any>}
   */
  httpClient(uri, req) {
    req.cache = 'no-cache'
    req.headers = {
      Client: `tcabaci-read-js-client${this.version}`,
    }

    if (typeof AbortSignal !== 'undefined') {
      req.signal = AbortSignal.timeout(10000)
    }

    req.priority = 'high'

    return fetch(this.readNodeAddress + uri, req).then((response) =>
      this.handleRestResponse(response),
    )
  }

  Socket() {
    return this.ws
  }

  /**
   * @param {successCallback} cb
   * @constructor
   */
  SetSuccessCallback(cb) {
    this.successCb = cb

    return this
  }

  /**
   * @param {errorCallback} cb
   * @constructor
   */
  SetErrorCallback(cb) {
    this.errorCb = cb

    return this
  }

  /**
   * @param {closeCallback} cb
   * @constructor
   */
  SetCloseCallback(cb) {
    this.closeCb = cb

    return this
  }

  /**
   * @param {listenCallback} cb
   * @constructor
   */
  SetListenCallback(cb) {
    this.listenCb = cb

    return this
  }

  async Start() {
    return this.connect()
  }

  Stop() {
    if (!this.getConnected()) {
      throw NOT_CONNECTED
    }
    this.Disconnect(1000)
    this.setConnected(false)
    this.setSubscribed(false)

    return this
  }

  Subscribe(addresses = [], txTypes = []) {
    if (!Array.isArray(addresses)) {
      throw INVALID_ARGUMENTS
    }

    if (txTypes && !Array.isArray(addresses)) {
      throw INVALID_ARGUMENTS
    }

    if (txTypes.length && txTypes.length > Object.values(TX_TYPE).length) {
      throw INVALID_ARGUMENTS
    }

    if (!this.getConnected()) {
      throw NOT_CONNECTED
    }

    let addrs = []

    if (addresses.length === 0) {
      throw ADDRESSES_IS_EMPTY
    }

    addrs = addresses

    if (this.getSubscribeAddresses().length > 0) {
      let newAddress = []

      for (let i = 0; i < addresses.length; i++) {
        if (this.getSubscribeAddresses().indexOf(addresses[i]) === -1) {
          newAddress.push(addresses[i])
        }
      }
      addrs = newAddress
    }

    const message = new Message(true, MESSAGE_TYPE.SUBSCRIBE, addrs, txTypes)

    this.ws.send(message.ToJSONString())
    this.setSubscribeAddresses(addrs, true)
    this.setSubscribed(true)
  }

  Unsubscribe() {
    if (!this.getSubscribed()) {
      throw NOT_SUBSCRIBED
    }
    this.ws.send(
      new Message(
        true,
        MESSAGE_TYPE.UNSUBSCRIBE,
        this.getSubscribeAddresses(),
      ).ToJSONString(),
    )
    this.setSubscribed(false)
    this.setSubscribeAddresses([])
  }

  /**
   * @return {Promise<any>}
   */
  LastBlock() {
    return this.httpClient('/v1/blocks?limit=1&offset=0', {
      method: 'GET',
    })
      .then((res) => {
        return { blocks: res.data, total_count: res.total_count }
      })
      .catch((e) => this.handleRestError(e, BLOCK_NOT_FOUND))
  }

  /**
   * @param {?Array<string>} recipientAddrs
   * @param {?Array<string>} senderAddrs
   * @param {?string} typ
   * @param {?Array<string>}
   * @return {Promise<any>}
   */
  TxSummary({ recipientAddrs, senderAddrs, typ, types }) {
    if (!recipientAddrs && !senderAddrs) {
      return Promise.reject(INVALID_ARGUMENTS)
    }

    return this.httpClient('/v1/tx_summary', {
      method: 'POST',
      body: JSON.stringify({
        recipient_addrs: recipientAddrs,
        sender_addrs: senderAddrs,
        ...(types ? { types: types } : { typ: typ }),
      }),
    })
      .then((res) => {
        return {
          first_block_height: res.data.first_block_height,
          first_transaction: res.data.first_transaction,
          last_block_height: res.data.last_block_height,
          last_transaction: res.data.last_transaction,
          total_count: res.total_count,
        }
      })
      .catch((e) => this.handleRestError(e))
  }

  /**
   * @param {string} heightOperator
   * @param {number} height
   * @param {?number} maxHeight
   * @param {?number} lastOrder
   * @param {?Array<string>} recipientAddrs
   * @param {?Array<string>} senderAddrs
   * @param {?Array<string>} hashes
   * @param {string} typ
   * @param {?Array<string>} types
   * @param {number} limit
   * @param {number} offset
   * @param {string} orderField
   * @param {string} orderBy
   * @return {Promise<any>}
   */
  TxSearch({
    heightOperator,
    height,
    maxHeight,
    lastOrder,
    recipientAddrs,
    senderAddrs,
    hashes,
    typ,
    types,
    limit,
    offset,
    orderField,
    orderBy,
  }) {
    return this.httpClient('/v1/tx_search/p', {
      method: 'POST',
      body: JSON.stringify({
        height: `${heightOperator} ${height}`,
        ...(maxHeight ? { max_height: maxHeight } : {}),
        ...(lastOrder ? { last_order: lastOrder } : {}),
        ...(recipientAddrs ? { recipient_addrs: recipientAddrs } : {}),
        ...(senderAddrs ? { sender_addrs: senderAddrs } : {}),
        ...(hashes ? { hashes: hashes } : {}),
        ...(limit ? { limit: limit } : {}),
        ...(offset ? { offset: offset } : {}),
        ...(orderField ? { order_field: orderField } : {}),
        ...(orderBy ? { order_by: orderBy } : {}),
        ...(types ? { types: types } : typ ? { typ: typ } : {}),
      }),
    })
      .then((res) => {
        return {
          txs: res.data,
          total_count: res.total_count,
        }
      })
      .catch((e) => this.handleRestError(e))
  }

  Status() {
    return {
      connected: this.connected,
      subscribed: this.subscribed,
    }
  }

  /**
   * @param {string} id
   * @param {number} version
   * @param {string} type
   * @param {string} data
   * @param {string} sender_addr
   * @param {string} recipient_addr
   * @param {string} sign
   * @param {number} fee
   * @return {Promise<any>}
   */
  Broadcast({
    id,
    version,
    type,
    data,
    sender_addr,
    recipient_addr,
    sign,
    fee,
  }) {
    if (Object.values(TX_TYPE).indexOf(type) < 0) {
      throw TRANSACTION_TYPE_NOT_VALID
    }

    return this.httpClient('/v1/tx', {
      method: 'POST',
      body: JSON.stringify({
        id,
        version,
        type,
        data,
        sender_addr,
        recipient_addr,
        sign,
        fee,
      }),
    })
      .then((res) => {
        return { data: res.data }
      })
      .catch((e) => this.handleRestError(e, { 400: TRANSACTION_NOT_BROADCAST }))
  }

  /**
   * @param {Array<string>} addresses
   * @param {?number} maxHeight
   * @return {Promise<*>}
   * @constructor
   */
  Bulk(addresses = [], maxHeight = null) {
    return this.httpClient('/v1/bulk_tx', {
      method: 'POST',
      body: JSON.stringify({
        addresses: addresses,
        ...(maxHeight ? { max_height: maxHeight } : {}),
      }),
    })
  }

  Disconnect(code = 1000) {
    if (this.getConnected()) {
      this.ws.close(code)
    }
  }

  Reconnect(code = 1000) {
    if (this.getConnected()) {
      this.ws.reconnect(code)
    }

    return this
  }

  callSuccessCallback(event) {
    if (this.successCb) this.successCb(event)
  }

  callErrorCallback(event) {
    if (this.errorCb) this.errorCb(event)
  }

  callCloseCallback(event) {
    if (this.closeCb) this.closeCb(event)
  }

  callListenCallback(message) {
    if (this.listenCb) this.listenCb(message)
  }


  /**
   * @return {Promise<Event>}
   */
  async connect() {
    if (this.getConnected()) {
      return Promise.reject(ALREADY_CONNECTED)
    }

    const options = {
      WebSocket: this.wsLibrary,
      connectionTimeout: 1000,
      maxRetries: 10,
    }

    this.ws = new ReconnectingWebSocket(this.readNodeWSAddress, [], options)

    return new Promise((resolve, reject) => {
      this.ws.onerror = (event) => {
        this.setConnected(false)
        this.setSubscribed(false)
        this.callErrorCallback(event)

        reject(event)
      }
      this.ws.onopen = (event) => {
        this.setConnected(true)
        this.callSuccessCallback(event)

        resolve(event)
      }
      this.ws.onmessage = (message) => {
        if (message.data === 'OK' && message.data.length < 10) {
          return { status: message.data }
        }

        this.callListenCallback(toJSON(message.data))
      }
      this.ws.onclose = (event) => {
        this.setConnected(false)
        this.setSubscribed(false)
        this.callCloseCallback(event)

        resolve(event)
      }
    })
  }

  getConnected() {
    return this.connected
  }

  setConnected(value) {
    this.connected = value
  }

  getSubscribed() {
    return this.subscribed
  }

  setSubscribed(value) {
    this.subscribed = value
  }

  getSubscribeAddresses() {
    return this.subscribedAddresses
  }

  setSubscribeAddresses(addresses, push = false) {
    if (push) {
      this.subscribedAddresses.push(...addresses)

      return
    }
    this.subscribedAddresses = addresses
  }

  /**
   * @param {Response} response
   * @return {Promise<*>}
   */
  async handleRestResponse(response) {
    if (response.status >= 200 && response.status < 400) {
      return response.json()
    }

    let data = await response.text()

    try {
      data = JSON.parse(data)

      return Promise.reject(
        new FetchError(data.message).setCode(response.status).setResponse(data),
      )
    } catch (e) {
      return Promise.reject(new FetchError(response.statusText))
    }
  }

  /**
   * @param {Error} err
   * @param {?Object|Error} custom
   */
  handleRestError(err, custom = null) {
    const code = err.code

    if (custom && typeof custom === 'object' && custom[code]) {
      throw custom[code]
    } else if (custom instanceof Error) {
      throw custom
    }

    switch (code) {
      case 400:
        throw INVALID_ARGUMENTS
      case 'ERR_NETWORK':
        throw ERR_NETWORK
      default:
        throw err
    }
  }
}

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

export default class TCAbciClient {
  subscribed = false
  subscribedAddresses = []
  connected = false
  version = 'v2.0.0'
  errorCb = null
  listenCb = null
  ws = null
  readNodeAddress = READ_NODE_ADDRESS
  readNodeWSAddress = READ_NODE_WS_ADDRESS

  /**
   *
   * @param {Array<String>} readNodeAddresses
   */
  constructor(readNodeAddresses = []) {
    if (readNodeAddresses.length === 2) {
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
      'X-Client': `tcabaci-read-js-client${this.version}`,
    }

    if (typeof AbortSignal !== 'undefined') {
      req.signal = AbortSignal.timeout(10000)
    }

    req.priority = 'high'

    return fetch(this.readNodeAddress + uri, req).then((response) => {
      if (response.ok) return response.json()

      return Promise.reject(
        new FetchError(response.statusText, response.status),
      )
    })
  }

  Socket() {
    return this.ws
  }

  SetErrorCallback(cb) {
    this.errorCb = cb
  }

  SetListenCallback(cb) {
    this.listenCb = cb
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
        recipient_addrs: recipientAddrs,
        sender_addrs: senderAddrs,
        hashes: hashes,
        limit,
        offset,
        order_field: orderField,
        order_by: orderBy,
        ...(types ? { types: types } : { typ: typ }),
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
        return { data: res.data.data }
      })
      .catch((e) => this.handleRestError(e, { 400: TRANSACTION_NOT_BROADCAST }))
  }

  Bulk(addresses = []) {
    return this.httpClient('/v1/bulk_tx', {
      method: 'POST',
      body: JSON.stringify({ addresses: addresses }),
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
  }

  async connect() {
    const wsClient = await this.wsClient()

    return new Promise((resolve, reject) => {
      if (this.getConnected()) {
        reject(ALREADY_CONNECTED)
      }

      const options = {
        WebSocket: wsClient,
        connectionTimeout: 1000,
        maxRetries: 10,
      }

      this.ws = new ReconnectingWebSocket(this.readNodeWSAddress, [], options)

      this.ws.onerror = (event) => {
        this.setConnected(false)
        if (this.errorCb) {
          this.errorCb(event.error)
        }
        reject(event.error)
      }
      this.ws.onopen = (event) => {
        this.setConnected(true)
        resolve(event)
      }
      this.ws.onmessage = (message) => {
        if (message.data === 'OK' && message.data.length < 10) {
          return { status: message.data }
        }
        if (this.listenCb) {
          this.listenCb(toJSON(message.data))
        }
      }
      this.ws.onclose = (event) => {
        this.setConnected(false)
        if (this.errorCb) {
          this.errorCb(event.error)
        }
      }
    })
  }

  async wsClient() {
    if (
      typeof window !== 'undefined' &&
      typeof window.WebSocket !== 'undefined'
    ) {
      return window.WebSocket
    }
    const { WebSocket } = await import('ws')

    return WebSocket
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

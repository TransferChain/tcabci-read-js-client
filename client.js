import {
  ADDRESSES_IS_EMPTY,
  ALREADY_CONNECTED,
  BLOCK_NOT_FOUND,
  ERR_NETWORK,
  FetchError,
  INVALID_ARGUMENT_WITH_CS,
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
} from './constants.js'
import Message from './message.js'
import { isJSON, toJSON } from './util.js'
import { Options } from './websocketOptions.js'
import { TWebSocket } from './websocket.js'
import { TX_TYPE, TX_TYPE_LIST } from './transaction.js'

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
  _subscribed = false
  _subscribedAddresses = []
  _subscribedSignedData = {}
  _connected = false
  _chainName = 'transferchain'
  _chainVersion = 'v1'
  _version = `v2.5.5`
  /**
   * @type {?successCallback}
   */
  _successCb = null
  /**
   * @type {?errorCallback}
   */
  _errorCb = null
  /**
   * @type {?closeCallback}
   */
  _closeCb = null
  /**
   * @type {?listenCallback}
   */
  _listenCb = null
  _wsLibrary = null
  /**
   * @type {TWebSocket}
   */
  _ws
  _readNodeAddress = READ_NODE_ADDRESS
  _readNodeWSAddress = READ_NODE_WS_ADDRESS

  /**
   * @param {Array<String>} readNodeAddresses
   * @param {WebSocket} wsLibrary
   * @param {?string} chainName
   * @param {?string} chainVersion
   */
  constructor(
    readNodeAddresses = [],
    wsLibrary,
    chainName = null,
    chainVersion = null,
  ) {
    if (!wsLibrary) throw new Error(INVALID_ARGUMENTS)
    this._wsLibrary = wsLibrary

    if (Array.isArray(readNodeAddresses) && readNodeAddresses.length === 2) {
      this._readNodeAddress = readNodeAddresses[0]
      this._readNodeWSAddress = readNodeAddresses[1]

      if (!readNodeAddresses[0].startsWith('http'))
        throw new Error(INVALID_ARGUMENTS)
      if (!readNodeAddresses[1].startsWith('ws'))
        throw new Error(INVALID_ARGUMENTS)
    }

    if (chainName) this._chainName = chainName
    if (chainVersion) this._chainVersion = chainVersion
  }

  /**
   * @param {string} uri
   * @param {RequestInit} req
   * @return {Promise<any>}
   */
  httpClient(uri, req) {
    req.cache = 'no-cache'
    req.headers = {
      Client: `tcabaci-read-js-client-${this._version}`,
    }
    req.priority = 'high'

    return fetch(this._readNodeAddress + uri, req).then((response) =>
      this.handleRestResponse(response),
    )
  }

  Socket() {
    return this._ws
  }

  /**
   * @param {successCallback} cb
   * @constructor
   */
  SetSuccessCallback(cb) {
    this._successCb = cb

    return this
  }

  /**
   * @param {errorCallback} cb
   * @constructor
   */
  SetErrorCallback(cb) {
    this._errorCb = cb

    return this
  }

  /**
   * @param {closeCallback} cb
   * @constructor
   */
  SetCloseCallback(cb) {
    this._closeCb = cb

    return this
  }

  /**
   * @param {listenCallback} cb
   * @constructor
   */
  SetListenCallback(cb) {
    this._listenCb = cb

    return this
  }

  async Start() {
    return this.connect()
  }

  /**
   * @return {Awaited<TCaBCIClient>}
   * @throws {Error}
   */
  async Stop() {
    if (!this.getConnected()) {
      throw new Error(NOT_CONNECTED)
    }
    await this.Disconnect(1000)
    this.setConnected(false)
    this.setSubscribed(false)

    return this
  }

  /**
   * @param {Array<string>} addresses
   * @param {Object} signedData
   * @param {?Array<string>} txTypes
   * @return {TCaBCIClient}
   * @throws {Error}
   */
  Subscribe(addresses, signedData, txTypes = null) {
    if (!Array.isArray(addresses) || addresses.length === 0)
      throw new Error(INVALID_ARGUMENT_WITH_CS('addresses'))

    if (typeof signedData !== 'object') throw new Error(INVALID_ARGUMENTS)

    if (txTypes && Array.isArray(txTypes)) {
      if (!Array.isArray(txTypes))
        throw new Error(INVALID_ARGUMENT_WITH_CS('txTypes'))

      if (txTypes.length > TX_TYPE_LIST.length)
        throw new Error(INVALID_ARGUMENT_WITH_CS('txTypes'))

      for (let i = 0; i < txTypes.length; i++) {
        if (!TX_TYPE[txTypes[i]])
          throw new Error(INVALID_ARGUMENT_WITH_CS('txType ', txTypes[i]))
      }
    }

    if (!this.getConnected()) throw new Error(NOT_CONNECTED)

    let addrs = [],
      sdata = {}

    addrs = addresses
    sdata = signedData

    if (this.getSubscribeAddresses().length > 0) {
      let newAddress = []

      for (let i = 0; i < addresses.length; i++) {
        if (this.getSubscribeAddresses().indexOf(addresses[i]) === -1) {
          newAddress.push(addresses[i])
        }
      }
      addrs = newAddress
    }

    if (this.getSubscribedSignedData().length > 0) {
      sdata = this.getSubscribedSignedData()
    }

    const message = new Message(
      true,
      MESSAGE_TYPE.SUBSCRIBE,
      addrs,
      sdata,
      txTypes,
    )

    this._ws.send(message.ToJSON())
    this.setSubscribeAddresses(addrs, true)
      .setSubscribeSignedData(signedData)
      .setSubscribed(true)

    return this
  }

  Unsubscribe() {
    if (!this.getSubscribed()) {
      throw new Error(NOT_SUBSCRIBED)
    }
    this._ws.send(
      new Message(
        true,
        MESSAGE_TYPE.UNSUBSCRIBE,
        this.getSubscribeAddresses(),
      ).ToJSON(),
    )
    this.setSubscribed(false)
    this.setSubscribeAddresses([])
    this.setSubscribeSignedData({})
  }

  /**
   * @param {?string} chainName
   * @param {?string} chainVersion
   * @return {Promise<any>}
   */
  LastBlock(chainName = null, chainVersion = null) {
    return this.httpClient(
      `/v1/blocks?chain_name=${chainName ?? this._chainName}&chain_version=${chainVersion ?? this._chainVersion}&limit=1&offset=0`,
      {
        method: 'GET',
      },
    )
      .then((res) => {
        return { blocks: res.data, total_count: res.total_count }
      })
      .catch((e) => this.handleRestError(e, new Error(BLOCK_NOT_FOUND)))
  }

  /**
   * @param {string} id
   * @param {string} signature
   * @return {Promise<*>}
   */
  Tx(id, signature) {
    if (!id || typeof id !== 'string') {
      return Promise.reject(new Error(INVALID_ARGUMENTS))
    }

    return this.httpClient(`/v1/tx/${id}`, {
      method: 'GET',
      headers: { 'X-Signature': signature },
    })
      .then((res) => {
        return { tx: res.data }
      })
      .catch((e) => this.handleRestError(e))
  }

  /**
   * @param {?Array<string>} recipientAddrs
   * @param {?Array<string>} senderAddrs
   * @param {?Object} signedData
   * @param {?string} typ
   * @param {?Array<string>} types
   * @param {?string} chainName
   * @param {?string} chainVersion
   * @return {Promise<any>}
   */
  TxSummary({
    recipientAddrs,
    senderAddrs,
    signedData,
    typ,
    types = null,
    chainName = null,
    chainVersion = null,
  }) {
    if (!recipientAddrs && !senderAddrs) {
      return Promise.reject(new Error(INVALID_ARGUMENTS))
    }

    return this.httpClient('/v1/tx_summary', {
      method: 'POST',
      body: JSON.stringify({
        chain_name: chainName ?? this._chainName,
        chain_version: chainVersion ?? this._chainVersion,
        recipient_addrs: recipientAddrs,
        sender_addrs: senderAddrs,
        signed_addrs: signedData,
        ...(types ? { types: types } : { typ: typ }),
      }),
    })
      .then((res) => {
        return {
          chain_name: res.data.chain_name,
          chain_version: res.data.chain_version,
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
   * @param {?Object} signedData
   * @param {?Array<string>} hashes
   * @param {string} typ
   * @param {?Array<string>} types
   * @param {number} limit
   * @param {number} offset
   * @param {string} orderField
   * @param {string} orderBy
   * @param {?string} chainName
   * @param {?string} chainVersion
   * @return {Promise<any>}
   */
  TxSearch({
    heightOperator,
    height,
    maxHeight,
    lastOrder,
    recipientAddrs,
    senderAddrs,
    signedData,
    hashes,
    typ,
    types,
    limit,
    offset,
    orderField,
    orderBy,
    chainName = null,
    chainVersion = null,
  }) {
    return this.httpClient('/v1/tx_search/p', {
      method: 'POST',
      body: JSON.stringify({
        chain_name: chainName ?? this._chainName,
        chain_version: chainVersion ?? this._chainVersion,
        height: `${heightOperator} ${height}`,
        ...(maxHeight ? { max_height: maxHeight } : {}),
        ...(lastOrder ? { last_order: lastOrder } : {}),
        ...(recipientAddrs ? { recipient_addrs: recipientAddrs } : {}),
        ...(senderAddrs ? { sender_addrs: senderAddrs } : {}),
        ...(signedData ? { signed_addrs: signedData } : {}),
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
      chain_name: this._chainName,
      chain_version: this._chainVersion,
      connected: this._connected,
      subscribed: this._subscribed,
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
  BroadcastCommit({
    id,
    version,
    type,
    data,
    sender_addr,
    recipient_addr,
    sign,
    fee,
  }) {
    return this.broadcast(
      {
        id,
        version,
        type,
        data,
        sender_addr,
        recipient_addr,
        sign,
        fee,
      },
      false,
      true,
    )
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
  BroadcastSync({
    id,
    version,
    type,
    data,
    sender_addr,
    recipient_addr,
    sign,
    fee,
  }) {
    return this.broadcast(
      {
        id,
        version,
        type,
        data,
        sender_addr,
        recipient_addr,
        sign,
        fee,
      },
      true,
      false,
    )
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
    return this.broadcast(
      {
        id,
        version,
        type,
        data,
        sender_addr,
        recipient_addr,
        sign,
        fee,
      },
      false,
      false,
    )
  }

  broadcast(
    { id, version, type, data, sender_addr, recipient_addr, sign, fee },
    sync = false,
    commit = false,
  ) {
    if (!TX_TYPE_LIST.includes(type)) {
      throw new Error(TRANSACTION_TYPE_NOT_VALID)
    }

    return this.httpClient(
      commit ? '/v1/tx/commit' : sync ? '/v1/tx/sync' : '/v1/tx',
      {
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
      },
    )
      .then((res) => {
        return { data: res.data }
      })
      .catch((e) =>
        this.handleRestError(e, { 400: new Error(TRANSACTION_NOT_BROADCAST) }),
      )
  }

  /**
   * @param {Array<string>} addresses
   * @param {Object} signedData
   * @param {?number} maxHeight
   * @param {?string} chainName
   * @param {?string} chainVersion
   * @return {Promise<*>}
   * @constructor
   */
  Bulk(
    addresses = [],
    signedData = {},
    maxHeight = null,
    chainName = null,
    chainVersion = null,
  ) {
    return this.httpClient('/v1/bulk_tx', {
      method: 'POST',
      body: JSON.stringify({
        chain_name: chainName ?? this._chainName,
        chain_version: chainVersion ?? this._chainVersion,
        addresses: addresses,
        signed_addrs: signedData,
        ...(maxHeight ? { max_height: maxHeight } : {}),
      }),
    })
  }

  async Disconnect(code = 1000) {
    if (this.getConnected()) {
      await this._ws.disconnect(code)

      this.setConnected(false)
      this.setSubscribed(false)
    }
  }

  async Reconnect(code = 1000) {
    if (this.getConnected()) {
      await this.Disconnect(code)
    }

    await this.connect()

    return this
  }

  callSuccessCallback(event) {
    if (this._successCb) this._successCb(event)
  }

  callErrorCallback(event) {
    if (this._errorCb) this._errorCb(event)
  }

  callCloseCallback(event) {
    if (this._closeCb) this._closeCb(event)
  }

  callListenCallback(message) {
    if (this._listenCb) this._listenCb(message)
  }

  /**
   * @return {Promise<TWebSocket>}
   */
  async connect() {
    if (this.getConnected()) {
      return Promise.reject(new Error(ALREADY_CONNECTED))
    }

    const options = new Options(this._readNodeWSAddress)
    options.setCustomWS(this._wsLibrary)

    this._ws = new TWebSocket(options)

    this._ws.addErrorListener((e) => {
      this.setConnected(false)
      this.setSubscribed(false)
      this.setSubscribeAddresses([], false)
      this.setSubscribeSignedData({})
      this.callErrorCallback(e)
    })

    this._ws.addOpenListener((e) => {
      this.setConnected(true)
      this.callSuccessCallback(e)
    })

    this._ws.addMessageListener((message) => {
      if (message.data === 'OK' && message.data.length < 10) {
        return { status: message.data }
      }

      this.callListenCallback(
        !isJSON(message.data) ? message.data : toJSON(message.data),
      )
    })

    this._ws.addCloseListener((e) => {
      this.setConnected(false)
      this.setSubscribed(false)
      this.setSubscribeAddresses([], false)
      this.setSubscribeSignedData({})
      this.callCloseCallback(e)
    })

    return this._ws.connect()
  }

  getConnected() {
    return this._connected
  }

  setConnected(value) {
    this._connected = value
  }

  getSubscribed() {
    return this._subscribed
  }

  setSubscribed(value) {
    this._subscribed = value
  }

  getSubscribeAddresses() {
    return this._subscribedAddresses
  }

  getSubscribedSignedData() {
    return this._subscribedSignedData
  }

  /**
   * @param {Array<string>} addresses
   * @param {?boolean} push
   * @return {TCaBCIClient}
   */
  setSubscribeAddresses(addresses, push = false) {
    if (push) {
      this._subscribedAddresses.push(...addresses)

      return this
    }
    this._subscribedAddresses = addresses

    return this
  }

  /**
   * @param {Object} signedData
   * @return {TCaBCIClient}
   */
  setSubscribeSignedData(signedData) {
    this._subscribedSignedData = signedData

    return this
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
   * @throws Error
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
        throw new Error(INVALID_ARGUMENTS)
      case 'ERR_NETWORK':
        throw new Error(ERR_NETWORK)
      default:
        throw err
    }
  }
}

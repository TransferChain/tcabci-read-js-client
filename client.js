import {
  FetchError,
  ALREADY_CONNECTED,
  BLOCK_NOT_FOUND,
  ERR_NETWORK,
  INVALID_ARGUMENT_WITH_CS,
  INVALID_ARGUMENTS,
  NOT_CONNECTED,
  NOT_SUBSCRIBED,
  TRANSACTION_NOT_BROADCAST,
  TRANSACTION_TYPE_NOT_VALID,
} from './errors.js'
import {
  SUBSCRIBEMessage,
  UNSUBSCRIBEMessage,
  READ_NODE_ADDRESS,
  READ_NODE_WS_ADDRESS,
} from './constants.js'
import Message from './message.js'
import { isJSON, fromJSON } from './util.js'
import { Options } from './websocketOptions.js'
import { TWebSocket } from './websocket.js'
import { TX_TYPE_LIST } from './transaction.js'

/**
 * @callback SuccessCallback
 * @param {Event} event
 * @return void
 */

/**
 * @callback ErrorCallback
 * @param {Event} event
 * @return void
 */

/**
 * @callback CloseCallback
 * @param {Event} event
 * @return void
 */

/**
 * @callback ListenCallback
 * @param {*} message
 * @return void
 */

export default class TCaBCIClient {
  _subscribed = false
  _subscribedAddresses = []
  _SubscribedSignedData = {}
  _connected = false
  _chainName = 'transferchain'
  _chainVersion = 'v1'
  _version = `v2.5.11`
  /**
   * @type {?SuccessCallback}
   */
  _successCb = null
  /**
   * @type {?ErrorCallback}
   */
  _errorCb = null
  /**
   * @type {?CloseCallback}
   */
  _closeCb = null
  /**
   * @type {?ListenCallback}
   */
  _listenCb = null
  _wsLibrary = null
  /**
   * @type {Options}
   * @private
   */
  _options
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
      if (!readNodeAddresses[0].startsWith('http'))
        throw new Error(INVALID_ARGUMENTS)
      if (!readNodeAddresses[1].startsWith('ws'))
        throw new Error(INVALID_ARGUMENTS)

      this._readNodeAddress = readNodeAddresses[0]
      this._readNodeWSAddress = readNodeAddresses[1]
    }

    this._options = new Options(this._readNodeWSAddress)
    this._options.setCustomWS(this._wsLibrary)

    if (chainName) this._chainName = chainName
    if (chainVersion) this._chainVersion = chainVersion
  }

  SetDebug(debug) {
    this._options.setDebug(debug)
    return this
  }

  /**
   * @param {SuccessCallback} cb
   * @return {TCaBCIClient}
   */
  SetSuccessCallback(cb) {
    this._successCb = cb

    return this
  }

  /**
   * @param {ErrorCallback} cb
   * @return {TCaBCIClient}
   */
  SetErrorCallback(cb) {
    this._errorCb = cb

    return this
  }

  /**
   * @param {CloseCallback} cb
   * @return {TCaBCIClient}
   */
  SetCloseCallback(cb) {
    this._closeCb = cb

    return this
  }

  /**
   * @param {ListenCallback} cb
   * @return {TCaBCIClient}
   */
  SetListenCallback(cb) {
    this._listenCb = cb

    return this
  }

  IsConnected() {
    return this._connected
  }

  IsSubscribed() {
    return this._subscribed
  }

  get SubscribeAddresses() {
    return this._subscribedAddresses
  }

  get SubscribedSignedData() {
    return this._SubscribedSignedData
  }

  get Socket() {
    return this._ws
  }

  async Reconnect(code = 1000) {
    if (this.IsConnected()) {
      await this._disconnect(code)
    }

    await this._connect()

    return this
  }

  async Start() {
    return this._connect()
  }

  /**
   * @param {?number} code
   * @return {Awaited<TCaBCIClient>}
   * @throws {Error}
   */
  async Stop(code = 1000) {
    if (!this.IsConnected()) {
      throw new Error(NOT_CONNECTED)
    }

    await this._disconnect(code)
    this._setConnected(false)
    this._setSubscribed(false)

    return this
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
        if (!TX_TYPE_LIST.includes(txTypes[i]))
          throw new Error(INVALID_ARGUMENT_WITH_CS('txType ', txTypes[i]))
      }
    }

    if (!this.IsConnected()) throw new Error(NOT_CONNECTED)

    const addrs = [],
      sdata = signedData ?? this.SubscribedSignedData

    addrs.push(...addresses)

    if (this.SubscribeAddresses.length > 0) {
      let newAddress = []

      for (let i = 0; i < addresses.length; i++) {
        if (this.SubscribeAddresses.indexOf(addresses[i]) === -1) {
          newAddress.push(addresses[i])
        }
      }
      addrs.push(...newAddress)
    }

    const message = new Message(true, SUBSCRIBEMessage, addrs, sdata, txTypes)

    this._ws.send(message.ToJSON())
    this._setSubscribeAddresses(addrs, true)
      ._setSubscribeSignedData(signedData)
      ._setSubscribed(true)

    return this
  }

  /**
   * @return {TCaBCIClient}
   */
  Unsubscribe() {
    if (!this.IsSubscribed()) {
      throw new Error(NOT_SUBSCRIBED)
    }
    this._ws.send(
      new Message(true, UNSUBSCRIBEMessage, this.SubscribeAddresses).ToJSON(),
    )
    this._setSubscribed(false)
    this._setSubscribeAddresses([])
    this._setSubscribeSignedData({})

    return this
  }

  /**
   * @param {?string} chainName
   * @param {?string} chainVersion
   * @return {Promise<{blocks: Object<string, *>, total_count: number}>}
   */
  LastBlock(chainName = null, chainVersion = null) {
    return this._httpClient(
      `/v1/blocks?chain_name=${chainName ?? this._chainName}&chain_version=${chainVersion ?? this._chainVersion}&limit=1&offset=0`,
      {
        method: 'GET',
      },
    )
      .then((res) => {
        return { blocks: res.data, total_count: res.total_count }
      })
      .catch((e) => this._handleRestError(e, new Error(BLOCK_NOT_FOUND)))
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

    return this._httpClient(`/v1/tx/${id}`, {
      method: 'GET',
      headers: { 'X-Signature': signature },
    })
      .then((res) => {
        return { tx: res.data }
      })
      .catch((e) => this._handleRestError(e))
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

    return this._httpClient('/v1/tx_summary', {
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
      .catch((e) => this._handleRestError(e))
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
    return this._httpClient('/v1/tx_search/p', {
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
      .catch((e) => this._handleRestError(e))
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

    return this._httpClient(
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
        this._handleRestError(e, { 400: new Error(TRANSACTION_NOT_BROADCAST) }),
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
    return this._httpClient('/v1/bulk_tx', {
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

  _callSuccessCallback(event) {
    if (this._successCb) this._successCb(event)
  }

  _callErrorCallback(event) {
    if (this._errorCb) this._errorCb(event)
  }

  _callCloseCallback(event) {
    if (this._closeCb) this._closeCb(event)
  }

  _callListenCallback(message) {
    if (this._listenCb) this._listenCb(message)
  }

  /**
   * @return {Promise<TWebSocket>}
   */
  async _connect() {
    if (this.IsConnected()) {
      return Promise.reject(new Error(ALREADY_CONNECTED))
    }

    this._ws = new TWebSocket(this._options)

    this._ws.addErrorListener((e) => {
      this._setConnected(false)
      this._setSubscribed(false)
      this._setSubscribeAddresses([], false)
      this._setSubscribeSignedData({})
      this._callErrorCallback(e)
    })

    this._ws.addOpenListener((e) => {
      this._setConnected(true)
      this._callSuccessCallback(e)
    })

    this._ws.addMessageListener((message) => {
      if (message.data === 'OK' && message.data.length < 10) {
        return { status: message.data }
      }

      this._callListenCallback(
        !isJSON(message.data) ? message.data : fromJSON(message.data),
      )
    })

    this._ws.addCloseListener((e) => {
      this._setConnected(false)
      this._setSubscribed(false)
      this._setSubscribeAddresses([], false)
      this._setSubscribeSignedData({})
      this._callCloseCallback(e)
    })

    return this._ws.connect()
  }

  /**
   * @param {?number} code
   * @return {Promise<TCaBCIClient>}
   */
  async _disconnect(code = 1000) {
    if (this.IsConnected()) {
      await this._ws.disconnect(code)

      this._setConnected(false)
      this._setSubscribed(false)
    }

    return this
  }

  _setSubscribed(value) {
    this._subscribed = value
  }

  _setConnected(value) {
    this._connected = value
  }

  /**
   * @param {Array<string>} addresses
   * @param {?boolean} push
   * @return {TCaBCIClient}
   */
  _setSubscribeAddresses(addresses, push = false) {
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
  _setSubscribeSignedData(signedData) {
    this._SubscribedSignedData = signedData

    return this
  }

  /**
   * @param {string} uri
   * @param {RequestInit} req
   * @return {Promise<any>}
   */
  _httpClient(uri, req) {
    req.cache = 'no-cache'
    req.headers = {
      Client: `tcabaci-read-js-client-${this._version}`,
    }
    req.priority = 'high'

    return fetch(this._readNodeAddress + uri, req).then((response) =>
      this._handleRestResponse(response),
    )
  }

  /**
   * @param {Response} response
   * @return {Promise<*>}
   */
  async _handleRestResponse(response) {
    if (response.status >= 200 && response.status < 400) {
      return response.json()
    }

    try {
      const data = JSON.parse(await response.text())

      return Promise.reject(
        new FetchError(data.message)
          .setStatus(response.status)
          .setResponse(data),
      )
    } catch (e) {
      return Promise.reject(
        new FetchError(response.statusText).setOriginError(e),
      )
    }
  }

  /**
   * @param {Error} err
   * @param {?Object|Error} custom
   * @throws Error
   */
  _handleRestError(err, custom = null) {
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

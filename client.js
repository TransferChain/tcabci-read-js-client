import {
  addresses as validateAddresses,
  signedData as validateSignedData,
  endpoint,
  closeCode,
  rfc3339Timestamp
} from './validation.js'
import {
  ALREADY_CONNECTED,
  BLOCK_NOT_FOUND,
  INVALID_ARGUMENT_WITH_CS,
  INVALID_ARGUMENTS,
  NOT_CONNECTED,
  NOT_SUBSCRIBED,
  TRANSACTION_NOT_BROADCAST,
  TRANSACTION_TYPE_NOT_VALID
} from './errors.js'
import { READ_NODE_ADDRESS, READ_NODE_WS_ADDRESS } from './constants.js'
import Message, {
  Block as MBlock,
  Transaction as MTransaction,
  SUBSCRIBEMessage,
  UNSUBSCRIBEMessage,
  Subscription,
  OK
} from './message.js'
import { Options } from './websocketOptions.js'
import { TWebSocket } from './websocket.js'
import { Transaction, TX_TYPE_LIST } from './transaction.js'
import { Block } from './block.js'
import { HTTP } from './http.js'

/**
 * @callback SuccessCallback
 * @param {Event} event
 * @return void
 */

/**
 * @callback ErrorCallback
 * @param {Error|Event|ErrorEvent} event
 * @return void
 */

/**
 * @callback CloseCallback
 * @param {Event} event
 * @return void
 */

/**
 * @callback ListenCallback
 * @param {?Block} block
 * @param {?Transaction} transaction
 * @param {?*} msg
 * @return void
 */

export default class TCaBCIClient {
  _httpClient
  _startPromise = null
  _generation = 0
  _subscribed = false
  _subscribedAddresses = []
  _SubscribedSignedData = {}
  _connected = false
  _chainName = 'transferchain'
  _chainVersion = 'v1'
  _version = `v2.7.11`
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
   * Create an HTTP/WebSocket client. Start initiates connection setup;
   * SetSuccessCallback reports when the socket is OPEN.
   * @param {string[]} [readNodeAddresses=[]] HTTP and WS endpoints, or defaults.
   * @param {import('./types.js').WebSocketConstructor} [wsLibrary=globalThis.WebSocket]
   * @param {string|null} [chainName=null]
   * @param {string|null} [chainVersion=null]
   * @param {import('./types.js').ClientOptions} [options={}] Limits and TLS policy.
   */
  constructor(
    readNodeAddresses = [],
    wsLibrary = globalThis.WebSocket,
    chainName = null,
    chainVersion = null,
    options = {}
  ) {
    if (!wsLibrary) throw new Error(INVALID_ARGUMENTS)

    this._wsLibrary = wsLibrary

    if (
      !Array.isArray(readNodeAddresses) ||
      ![0, 2].includes(readNodeAddresses.length)
    )
      throw new Error(INVALID_ARGUMENTS)

    if (readNodeAddresses.length === 2) {
      this._readNodeAddress = endpoint(
        readNodeAddresses[0],
        ['https:', 'http:'],
        options.allowInsecure
      ).href
      this._readNodeWSAddress = endpoint(
        readNodeAddresses[1],
        ['wss:', 'ws:'],
        options.allowInsecure
      ).href
    }

    this._httpClient = new HTTP(this._readNodeAddress, options)
    this._options = new Options(this._readNodeWSAddress)
      .setAllowInsecure(options.allowInsecure)
      .setCustomWS(this._wsLibrary)

    if (typeof options.maxMessageBytes !== 'undefined')
      this._options.setMaxMessageBytes(options.maxMessageBytes)

    if (typeof options.maxEnqueuedMessages !== 'undefined')
      this._options.setMaxEnqueuedMessages(options.maxEnqueuedMessages)

    if (typeof options.maxPendingCallbacks !== 'undefined')
      this._options.setMaxPendingCallbacks(options.maxPendingCallbacks)

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
    if (cb !== null && typeof cb !== 'function')
      throw new TypeError('Invalid callback')

    this._successCb = cb

    return this
  }

  /**
   * @param {ErrorCallback} cb
   * @return {TCaBCIClient}
   */
  SetErrorCallback(cb) {
    if (cb !== null && typeof cb !== 'function')
      throw new TypeError('Invalid callback')

    this._errorCb = cb

    return this
  }

  /**
   * @param {CloseCallback} cb
   * @return {TCaBCIClient}
   */
  SetCloseCallback(cb) {
    if (cb !== null && typeof cb !== 'function')
      throw new TypeError('Invalid callback')

    this._closeCb = cb

    return this
  }

  /**
   * @param {ListenCallback} cb
   * @return {TCaBCIClient}
   */
  SetListenCallback(cb) {
    if (cb !== null && typeof cb !== 'function')
      throw new TypeError('Invalid callback')

    this._listenCb = cb

    return this
  }

  IsConnected() {
    return this._connected
  }

  IsSubscribed() {
    return this._subscribed
  }

  /** @returns {ReadonlyArray<string>} Frozen address copy. */
  get SubscribeAddresses() {
    return Object.freeze([...this._subscribedAddresses])
  }

  /** @returns {Readonly<Record<string, string>>} Frozen proof copy. */
  get SubscribedSignedData() {
    return Object.freeze({ ...this._SubscribedSignedData })
  }

  get Socket() {
    return this._ws
  }

  /**
   * Stop the old socket and initiate a replacement connection.
   * @param {number} [code=1000]
   * @returns {Promise<TCaBCIClient>}
   */
  async Reconnect(code = 1000) {
    const stopping = this._disconnect(code),
      generation = this._generation

    await stopping

    if (generation !== this._generation) return this

    await this._connect()

    return this
  }

  /**
   * Initiate one shared connection attempt; does not await the OPEN event.
   * @returns {Promise<TWebSocket>}
   */
  async Start() {
    return this._connect()
  }

  /**
   * Idempotently stop sockets, abort HTTP and release subscription state.
   * Application callbacks remain registered for reuse; Dispose releases them.
   * Caller-owned buffers are never zeroed or frozen.
   * @param {number} [code=1000]
   * @returns {Promise<TCaBCIClient>}
   */
  async Stop(code = 1000) {
    this._httpClient.abort()
    await this._disconnect(code)
    this._setConnected(false)
    this._setSubscribed(false)

    return this
  }

  /**
   * Return a detached, frozen status snapshot.
   * @returns {Readonly<import('./client.js').ClientStatus>}
   */
  Status() {
    return Object.freeze({
      chain_name: this._chainName,
      chain_version: this._chainVersion,
      connected: this._connected,
      subscribed: this._subscribed
    })
  }

  /**
   * Subscribe to at most 251 unique addresses, each at most 2048 characters.
   * The combined active address list is bounded. Proof maps are copied;
   * caller objects remain mutable. ACK updates IsSubscribed asynchronously.
   * @param {readonly string[]} addresses
   * @param {Readonly<Record<string, string>>} signedData
   * @param {readonly string[]|null} [txTypes=null]
   * @returns {TCaBCIClient}
   */
  Subscribe(addresses, signedData, txTypes = null) {
    const requested = validateAddresses(addresses),
      proof = validateSignedData(signedData)

    if (
      txTypes !== null &&
      (!Array.isArray(txTypes) ||
        txTypes.length > TX_TYPE_LIST.length ||
        txTypes.some((type) => !TX_TYPE_LIST.includes(type)))
    )
      throw new Error(INVALID_ARGUMENT_WITH_CS('txTypes'))

    if (!this.IsConnected()) throw new Error(NOT_CONNECTED)

    const addrs = validateAddresses([
      ...new Set([...this._subscribedAddresses, ...requested])
    ])

    this._ws.send(
      new Message({
        isWeb: true,
        type: SUBSCRIBEMessage,
        addrs: addrs,
        signedData: proof,
        txTypes
      }).ToJSON()
    )
    this._setSubscribeAddresses(addrs)._setSubscribeSignedData(proof)

    return this
  }

  /**
   * @return {TCaBCIClient}
   */
  Unsubscribe() {
    if (!this.IsSubscribed()) {
      throw new Error(NOT_SUBSCRIBED)
    }

    try {
      this._ws.send(
        new Message({
          isWeb: true,
          type: UNSUBSCRIBEMessage,
          addrs: this.SubscribeAddresses
        }).ToJSON()
      )
    } finally {
      this._clearSubscription()
    }

    return this
  }

  /**
   * Read the latest block; query values are URL-encoded.
   * @param {string|null} [chainName=null]
   * @param {string|null} [chainVersion=null]
   * @param {import('./types.js').RequestOptions} [requestOptions={}]
   * @returns {Promise<Readonly<Awaited<ReturnType<import('./client.js').default['LastBlock']>>>>} Frozen result; nested snapshots are readonly.
   */
  LastBlock(chainName = null, chainVersion = null, requestOptions = {}) {
    return this._request(
      `/v1/blocks?chain_name=${encodeURIComponent(chainName ?? this._chainName)}&chain_version=${encodeURIComponent(chainVersion ?? this._chainVersion)}&limit=1&offset=0`,
      {
        method: 'GET'
      },
      requestOptions
    )
      .then((res) => {
        return Object.freeze({
          blocks: Object.freeze([]),
          info: Object.freeze({
            chainName: chainName ?? this._chainName,
            chainVersion: chainVersion ?? this._chainVersion,
            hash: res.data.hash,
            height: res.data.height,
            txs: res.data.txs,
            createdAt: new Date(rfc3339Timestamp(res.data.inserted_at))
          }),
          total_count: res.total_count
        })
      })
      .catch((e) => this._httpClient.handleError(e, new Error(BLOCK_NOT_FOUND)))
  }

  /**
   * Read a transaction. Signature headers are never followed across redirects.
   * @param {string} id
   * @param {string} signature
   * @param {import('./types.js').RequestOptions} [requestOptions={}]
   * @returns {Promise<Readonly<{tx: Readonly<Transaction>}>>} Frozen result; nested snapshots are readonly.
   */
  Tx(id, signature, requestOptions = {}) {
    if (
      !id ||
      id === '.' ||
      id === '..' ||
      typeof id !== 'string' ||
      typeof signature !== 'string' ||
      !signature.length
    ) {
      return Promise.reject(new Error(INVALID_ARGUMENTS))
    }

    return this._request(
      `/v1/tx/${encodeURIComponent(id)}`,
      {
        method: 'GET',
        headers: { 'X-Signature': signature }
      },
      requestOptions
    )
      .then((res) => {
        const { transaction, error } = Transaction.FromObject(res.data)

        if (error) return Promise.reject(error)

        return Object.freeze({ tx: transaction })
      })
      .catch((e) => this._httpClient.handleError(e))
  }

  /**
   * Read transaction data with cancellation and a total request deadline.
   * @param {import('./client.js').TxQuery} query
   * @param {import('./types.js').RequestOptions} [requestOptions={}]
   * @returns {Promise<Readonly<Awaited<ReturnType<import('./client.js').default['TxSummary']>>>>} Frozen result; nested snapshots are readonly.
   */
  TxSummary(
    {
      recipientAddrs,
      senderAddrs,
      signedData,
      typ,
      types = null,
      chainName = null,
      chainVersion = null
    },
    requestOptions = {}
  ) {
    if (!recipientAddrs && !senderAddrs) {
      return Promise.reject(new Error(INVALID_ARGUMENTS))
    }

    if (recipientAddrs) recipientAddrs = validateAddresses(recipientAddrs)

    if (senderAddrs) senderAddrs = validateAddresses(senderAddrs)

    if (signedData) signedData = validateSignedData(signedData)

    return this._request(
      '/v1/tx_summary',
      {
        method: 'POST',
        body: JSON.stringify({
          chain_name: chainName ?? this._chainName,
          chain_version: chainVersion ?? this._chainVersion,
          recipient_addrs: recipientAddrs,
          sender_addrs: senderAddrs,
          signed_addrs: signedData,
          ...(types ? { types: types } : { typ: typ })
        })
      },
      requestOptions
    )
      .then((res) => {
        let firstTransaction, lastTransaction

        if (res.data.first_transaction) {
          const { transaction, error } = Transaction.FromObject(
            res.data.first_transaction
          )

          if (error) return Promise.reject(error)

          firstTransaction = transaction
        }

        if (res.data.last_transaction) {
          const { transaction, error: errorTwo } = Transaction.FromObject(
            res.data.last_transaction
          )

          if (errorTwo) return Promise.reject(errorTwo)

          lastTransaction = transaction
        }

        return Object.freeze({
          chain_name: res.data.chain_name,
          chain_version: res.data.chain_version,
          first_block_height: res.data.first_block_height,
          first_transaction: firstTransaction,
          last_block_height: res.data.last_block_height,
          last_transaction: lastTransaction,
          total_count: res.total_count
        })
      })
      .catch((e) => this._httpClient.handleError(e))
  }

  /**
   * Read transaction data with cancellation and a total request deadline.
   * @param {import('./client.js').TxSearchQuery} query
   * @param {import('./types.js').RequestOptions} [requestOptions={}]
   * @returns {Promise<Readonly<Awaited<ReturnType<import('./client.js').default['TxSearch']>>>>} Frozen result; nested snapshots are readonly.
   */
  TxSearch(
    {
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
      chainVersion = null
    },
    requestOptions = {}
  ) {
    if (recipientAddrs) recipientAddrs = validateAddresses(recipientAddrs)

    if (senderAddrs) senderAddrs = validateAddresses(senderAddrs)

    if (signedData) signedData = validateSignedData(signedData)

    return this._request(
      '/v1/tx_search/p',
      {
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
          ...(types ? { types: types } : typ ? { typ: typ } : {})
        })
      },
      requestOptions
    )
      .then((res) => {
        const data = []

        for (const _data of res.data) {
          const { transaction, error } = Transaction.FromObject(_data)

          if (error) return Promise.reject(error)

          data.push(transaction)
        }

        return Object.freeze({
          txs: Object.freeze(data),
          total_count: res.total_count
        })
      })
      .catch((e) => this._httpClient.handleError(e))
  }

  /**
   * Publish once: automatic retries are disabled to avoid duplicate writes.
   * @param {import('./client.js').BroadcastInput} input
   * @param {import('./types.js').RequestOptions} [requestOptions={}]
   * @returns {Promise<Readonly<{data: import('./types.js').JSONValue}>>} Frozen result; nested snapshots are readonly.
   */
  BroadcastCommit(
    { id, version, type, data, sender_addr, recipient_addr, sign, fee },
    requestOptions = {}
  ) {
    return this.broadcast(
      {
        id,
        version,
        type,
        data,
        sender_addr,
        recipient_addr,
        sign,
        fee
      },
      false,
      true,
      requestOptions
    )
  }

  /**
   * Publish once: automatic retries are disabled to avoid duplicate writes.
   * @param {import('./client.js').BroadcastInput} input
   * @param {import('./types.js').RequestOptions} [requestOptions={}]
   * @returns {Promise<Readonly<{data: import('./types.js').JSONValue}>>} Frozen result; nested snapshots are readonly.
   */
  BroadcastSync(
    {
      id,
      version,
      type,
      data,
      additional_data = null,
      cipher_data = null,
      sender_addr,
      recipient_addr,
      sign,
      fee
    },
    requestOptions = {}
  ) {
    return this.broadcast(
      {
        id,
        version,
        type,
        data,
        additional_data,
        cipher_data,
        sender_addr,
        recipient_addr,
        sign,
        fee
      },
      true,
      false,
      requestOptions
    )
  }

  /**
   * Publish once: automatic retries are disabled to avoid duplicate writes.
   * @param {import('./client.js').BroadcastInput} input
   * @param {import('./types.js').RequestOptions} [requestOptions={}]
   * @returns {Promise<Readonly<{data: import('./types.js').JSONValue}>>} Frozen result; nested snapshots are readonly.
   */
  Broadcast(
    {
      id,
      version,
      type,
      data,
      additional_data = null,
      cipher_data = null,
      sender_addr,
      recipient_addr,
      sign,
      fee
    },
    requestOptions = {}
  ) {
    return this.broadcast(
      {
        id,
        version,
        type,
        data,
        additional_data,
        cipher_data,
        sender_addr,
        recipient_addr,
        sign,
        fee
      },
      false,
      false,
      requestOptions
    )
  }

  /**
   * Internal/public legacy broadcast entry; never retries a write.
   * @param {import('./client.js').BroadcastInput} input
   * @param {boolean} [sync=false]
   * @param {boolean} [commit=false]
   * @param {import('./types.js').RequestOptions} [requestOptions={}]
   * @returns {Promise<Readonly<{data: import('./types.js').JSONValue}>>} Frozen result; nested snapshots are readonly.
   */
  broadcast(
    {
      id,
      version,
      type,
      data,
      additional_data = null,
      cipher_data = null,
      sender_addr,
      recipient_addr,
      sign,
      fee
    },
    sync = false,
    commit = false,
    requestOptions = {}
  ) {
    if (!TX_TYPE_LIST.includes(type)) {
      throw new Error(TRANSACTION_TYPE_NOT_VALID)
    }

    validateAddresses([sender_addr, recipient_addr])

    if (
      typeof id !== 'string' ||
      !id.length ||
      typeof sign !== 'string' ||
      !sign.length ||
      !Number.isSafeInteger(version) ||
      version < 0 ||
      !Number.isFinite(fee) ||
      fee < 0
    )
      throw new Error(INVALID_ARGUMENTS)

    return this._request(
      commit ? '/v1/tx/commit' : sync ? '/v1/tx/sync' : '/v1/tx',
      {
        method: 'POST',
        body: JSON.stringify({
          id,
          version,
          type,
          data,
          ...(additional_data ? { additional_data } : {}),
          ...(cipher_data ? { cipher_data } : {}),
          sender_addr,
          recipient_addr,
          sign,
          fee
        })
      },
      requestOptions
    )
      .then((res) => {
        return Object.freeze({ data: res.data })
      })
      .catch((e) =>
        this._httpClient.handleError(e, {
          400: new Error(TRANSACTION_NOT_BROADCAST)
        })
      )
  }

  /**
   * Read a bounded address batch (1..251 entries; 1..2048 chars per address).
   * @param {readonly string[]} [addresses=[]]
   * @param {Readonly<Record<string, string>>} [signedData={}]
   * @param {number|null} [maxHeight=null]
   * @param {string|null} [chainName=null]
   * @param {string|null} [chainVersion=null]
   * @param {import('./types.js').RequestOptions} [requestOptions={}]
   * @returns {Promise<import('./types.js').JSONValue>} Recursively readonly JSON snapshot.
   */
  Bulk(
    addresses = [],
    signedData = {},
    maxHeight = null,
    chainName = null,
    chainVersion = null,
    requestOptions = {}
  ) {
    addresses = validateAddresses(addresses)
    signedData = validateSignedData(signedData)

    return this._request(
      '/v1/bulk_tx',
      {
        method: 'POST',
        body: JSON.stringify({
          chain_name: chainName ?? this._chainName,
          chain_version: chainVersion ?? this._chainVersion,
          addresses: addresses,
          signed_addrs: signedData,
          ...(maxHeight ? { max_height: maxHeight } : {})
        })
      },
      requestOptions
    )
  }

  /**
   * @return {Promise<TWebSocket>}
   */
  async _connect() {
    if (this.IsConnected()) throw new Error(ALREADY_CONNECTED)

    if (this._startPromise) return this._startPromise

    if (this._ws) return this._ws

    const generation = this._generation,
      ws = new TWebSocket(this._options)

    this._ws = ws

    const current = () => generation === this._generation && this._ws === ws

    ws.addErrorListener((e) => {
      if (!current()) return

      this._setConnected(false)
      this._clearSubscription()
      this._callErrorCallback(e)
    })
    ws.addOpenListener((e) => {
      if (!current()) return

      this._setConnected(true)
      this._callSuccessCallback(e)
    })
    ws.addMessageListener((message) => {
      if (current()) this._callListenCallback(message.data)
    })
    ws.addCloseListener((e) => {
      if (!current()) return

      this._setConnected(false)
      this._clearSubscription()

      if (!ws.active) this._ws = null

      this._callCloseCallback(e)
    })

    const start = ws.connect()

    this._startPromise = start

    try {
      return await start
    } catch {
      if (current()) await this._disconnect()

      throw new Error('Connection failed')
    } finally {
      if (this._startPromise === start) this._startPromise = null
    }
  }

  async _disconnect(code = 1000) {
    code = closeCode(code)

    const ws = this._ws

    this._generation++
    this._ws = null
    this._startPromise = null
    this._setConnected(false)
    this._clearSubscription()
    await ws?.disconnect(code)

    return this
  }

  _clearSubscription() {
    this._setSubscribed(false)
    this._setSubscribeAddresses([])
    this._setSubscribeSignedData({})
  }

  /**
   * Stop all work and release application callback references.
   * @returns {Promise<TCaBCIClient>}
   */
  async Dispose() {
    await this.Stop()
    this._successCb = null
    this._errorCb = null
    this._closeCb = null
    this._listenCb = null

    return this
  }

  _request(uri, req, options = {}) {
    const readOnly =
      req.method === 'GET' ||
      ['/v1/tx_summary', '/v1/tx_search/p', '/v1/bulk_tx'].includes(uri)

    return this._httpClient.request(uri, req, { ...options, retry: readOnly })
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
      this._subscribedAddresses = [
        ...new Set([...this._subscribedAddresses, ...addresses])
      ]

      return this
    }

    this._subscribedAddresses = [...addresses]

    return this
  }

  /**
   * @param {Object} signedData
   * @return {TCaBCIClient}
   */
  _setSubscribeSignedData(signedData) {
    this._SubscribedSignedData = { ...signedData }

    return this
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
    let msg

    const { transaction, error: e1 } = Transaction.FromJSON(message)

    if (e1) {
      const { message: _msg, error: e2 } = Message.FromJSON(message)

      if (e2) {
        this._callErrorCallback(e2)

        return
      }

      switch (_msg.Type) {
        case MBlock:
          msg = Block.FromObject(_msg.Data)

          if (msg.error) {
            this._callErrorCallback(msg.error)

            return
          }

          if (this._listenCb) this._listenCb(msg.block, null, null)

          break
        case MTransaction:
          msg = Transaction.FromObject(_msg.Data)

          if (msg.error) {
            this._callErrorCallback(msg.error)

            return
          }

          if (this._listenCb) this._listenCb(null, msg.transaction, null)

          break
        case Subscription:
          if (_msg.State === OK) {
            this._setSubscribed(true)
          } else {
            this._clearSubscription()
          }

          break
        default:
          if (this._listenCb) this._listenCb(null, null, _msg)

          break
      }
    } else {
      if (this._listenCb) this._listenCb(null, transaction, null)
    }
  }
}

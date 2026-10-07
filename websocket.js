import { byteLength, closeCode } from './validation.js'
import { Options } from './websocketOptions.js'
import ReconnectingWebSocket from 'reconnecting-websocket'

export const MaxListenerSize = 100

export class TWebSocket {
  /**
   * @private
   * @type {Options}
   */
  _options

  /**
   * @private
   * @type {ReconnectingWebSocket}
   */
  _client

  _openListener = () => {}
  _messageListener = () => {}
  _errorListener = () => {}
  _closeListener = () => {}

  _openCallbacks = []
  _messageCallbacks = []
  _errorCallbacks = []
  _closeCallbacks = []

  _connectionErrorCount = 0
  _timers = new Set()
  _queuedMessages = 0
  _queuedBytes = 0

  /**
   * @param {Options} options
   * @constructor
   * @throws {Error}
   */
  constructor(options) {
    if (!(options instanceof Options))
      throw new TypeError('options must be a Options')

    options.check()
    this._options = options
  }

  /**
   * @return {boolean}
   */
  get active() {
    return Boolean(this._client)
  }

  get ready() {
    if (!this._client) return false

    return this._client.readyState === 1
  }

  /**
   * @return {ReadonlyArray<function>}
   */
  get openListeners() {
    return Object.freeze([...this._openCallbacks])
  }

  /**
   * @return {ReadonlyArray<function>}
   */
  get messageListeners() {
    return Object.freeze([...this._messageCallbacks])
  }

  /**
   * @return {ReadonlyArray<function>}
   */
  get errorListeners() {
    return Object.freeze([...this._errorCallbacks])
  }

  /**
   * @return {ReadonlyArray<function>}
   */
  get closeListeners() {
    return Object.freeze([...this._closeCallbacks])
  }

  /**
   * @param {?boolean} force
   * @return {Promise<TWebSocket>}
   * @throws {Error}
   */
  async connect(force = false) {
    if (!force && this.ready)
      throw new Error('already connect. please use force flag')

    return this._init(force)
  }

  /**
   * @param {?number} code
   * @return {Promise<TWebSocket>}
   * @throws {Error}
   */
  async reconnect(code = null) {
    this._close(code)
    await this._init(true)

    return this
  }

  /**
   * Close every socket state, clear queued callbacks and release references.
   * @param {number} [code=1000]
   * @returns {Promise<void>}
   */
  async disconnect(code = 1000) {
    return this._disconnect(code)
  }

  /**
   * Send a bounded message. Offline binary buffers are rejected, not retained.
   * @param {string|ArrayBuffer|Blob|ArrayBufferView} msg
   * @returns {void}
   */
  send(msg) {
    if (!this._client) throw new Error('Not connected')

    const size = byteLength(msg)

    if (size > this._options.maxMessageBytes)
      throw new Error('Message exceeds limit')

    if (!this.ready && typeof msg !== 'string')
      throw new Error('Binary messages require an open connection')

    if (this.ready) {
      if (this._client.bufferedAmount + size > this._options.maxMessageBytes)
        throw new Error('Outgoing buffer exceeds byte limit')
    } else if (
      this._queuedMessages >= this._options.maxEnqueuedMessages ||
      this._queuedBytes + size > this._options.maxMessageBytes
    ) {
      throw new Error('Outgoing queue exceeds limit')
    }

    this._client.send(msg)

    if (!this.ready) {
      this._queuedMessages++
      this._queuedBytes += size
    }
  }

  /**
   * @param {function(Event)} callback
   * @return {TWebSocket}
   * @throws {Error}
   */
  addOpenListener(callback) {
    return this._addListener('_openCallbacks', callback)
  }

  /**
   * @param {function(Event)} callback
   * @return {TWebSocket}
   */
  removeOpenListener(callback) {
    return this._removeListener('_openCallbacks', callback)
  }

  /**
   * @param {function(MessageEvent)} callback
   * @return {TWebSocket}
   * @throws {Error}
   */
  addMessageListener(callback) {
    return this._addListener('_messageCallbacks', callback)
  }

  /**
   * @param {function(MessageEvent)} callback
   * @return {TWebSocket}
   */
  removeMessageListener(callback) {
    return this._removeListener('_messageCallbacks', callback)
  }

  /**
   * @param {function(ErrorEvent)} callback
   * @return {TWebSocket}
   * @throws {Error}
   */
  addErrorListener(callback) {
    return this._addListener('_errorCallbacks', callback)
  }

  /**
   * @param {function(ErrorEvent)} callback
   * @return {TWebSocket}
   */
  removeErrorListener(callback) {
    return this._removeListener('_errorCallbacks', callback)
  }

  /**
   * @param {function(CloseEvent)} callback
   * @return {TWebSocket}
   * @throws {Error}
   */
  addCloseListener(callback) {
    return this._addListener('_closeCallbacks', callback)
  }

  /**
   * @param {function(CloseEvent)} callback
   * @return {TWebSocket}
   */
  removeCloseListener(callback) {
    return this._removeListener('_closeCallbacks', callback)
  }

  /**
   * @param {string} name
   * @param {function(any)} callback
   * @throws {Error}
   * @private
   */
  _addListener(name, callback) {
    if (typeof callback !== 'function') throw new TypeError('Invalid callback')

    if (this[name].length >= MaxListenerSize)
      throw new Error(`listener size must be ${MaxListenerSize}`)

    if (this[name].findIndex((v) => v === callback) > -1) return this

    this[name].push(callback)

    return this
  }

  /**
   * @param {string} name
   * @param {function(any)} callback
   * @private
   */
  _removeListener(name, callback) {
    const idx = this[name].findIndex((v) => v === callback)

    if (idx > -1) {
      this[name].splice(idx, 1)
    }

    return this
  }

  _callListener(name, value) {
    if (!this[name]) return

    if (
      this._timers.size + this[name].length >
      this._options.maxPendingCallbacks
    ) {
      this._fail(4008)

      return
    }

    for (const callback of this[name]) {
      const timer = setTimeout(() => {
        this._timers.delete(timer)

        if (!this[name].includes(callback)) return

        try {
          callback(value)
        } catch {
          if (name !== '_errorCallbacks')
            this._onError(new Error('Callback failed'))
        }
      }, 0)

      this._timers.add(timer)
    }
  }

  /**
   * @private
   * @param {?boolean} force
   * @return {Promise<TWebSocket>}
   * @throws {Error}
   */
  async _init(force = false) {
    if (!force && this._client) return this

    if (this._client) this._close(1000)

    this._make()

    return this
  }

  _make() {
    if (this._connectionErrorCount > 15) return

    this._client = new ReconnectingWebSocket(
      this._options.url,
      this._options.protocols,
      this._options.make()
    )

    this._openListener = (e) => {
      this._queuedMessages = 0
      this._queuedBytes = 0
      this._connectionErrorCount = 0
      this._onOpen(e)
    }
    this._client.addEventListener('open', this._openListener)

    this._closeListener = (e) => {
      this._onClose(e)
    }
    this._client.addEventListener('close', this._closeListener)

    this._messageListener = (e) => {
      this._onMessage(e)
    }
    this._client.addEventListener('message', this._messageListener)

    this._errorListener = (e) => {
      this._onError(e)

      if (this._connectionErrorCount > 15) {
        this._onError(new Error('Internet connectivity problem!'))
        this._disconnect().catch((err) => {
          this._onError(err)
        })

        return
      }

      this._connectionErrorCount++
    }
    this._client.addEventListener('error', this._errorListener)
  }

  /**
   * @private
   * @param {?number} code
   * @return {Promise<void>}
   */
  async _disconnect(code = 1000) {
    this._close(code)
  }

  _fail(code) {
    const callbacks = [...this._closeCallbacks]

    this._close(code)

    for (const callback of callbacks) {
      try {
        callback({ code, reason: 'Connection limit exceeded', wasClean: false })
      } catch {
        /* No payload logging. */
      }
    }
  }

  _close(code = 1000) {
    code = closeCode(code)
    this._queuedMessages = 0
    this._queuedBytes = 0

    for (const timer of this._timers) clearTimeout(timer)

    this._timers.clear()

    const client = this._client

    this._client = undefined
    client?.removeEventListener('open', this._openListener)
    client?.removeEventListener('close', this._closeListener)
    client?.removeEventListener('message', this._messageListener)
    client?.removeEventListener('error', this._errorListener)

    this._openCallbacks.length = 0
    this._errorCallbacks.length = 0
    this._closeCallbacks.length = 0
    this._messageCallbacks.length = 0

    this._openListener = () => {}
    this._closeListener = () => {}
    this._errorListener = () => {}
    this._messageListener = () => {}

    client?.close(code)
    this._connectionErrorCount = 0
  }

  /**
   * @param {CloseEvent} event
   * @private
   */
  _onClose(event) {
    this._callListener('_closeCallbacks', event)
  }

  /**
   * @param {Error|Event|ErrorEvent} event
   * @private
   */
  _onError(event) {
    this._callListener('_errorCallbacks', event)
  }

  /**
   * @param {MessageEvent} msg
   * @private
   */
  _onMessage(msg) {
    try {
      if (byteLength(msg.data) > this._options.maxMessageBytes) {
        this._fail(4009)

        return
      }
    } catch {
      this._fail(4003)

      return
    }

    this._callListener('_messageCallbacks', msg)
  }

  /**
   * @param {Event} event
   * @private
   */
  _onOpen(event) {
    this._callListener('_openCallbacks', event)
  }
}

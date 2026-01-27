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
  get ready() {
    if (!this._client) return false

    return this._client.readyState === WebSocket.OPEN
  }

  /**
   * @return {Array<function>}
   */
  get openListeners() {
    return this._openCallbacks
  }

  /**
   * @return {Array<function>}
   */
  get messageListeners() {
    return this._messageCallbacks
  }

  /**
   * @return {Array<function>}
   */
  get errorListeners() {
    return this._errorCallbacks
  }

  /**
   * @return {Array<function>}
   */
  get closeListeners() {
    return this._closeCallbacks
  }

  /**
   * @param {?boolean} force
   * @return {Awaited<TWebSocket>}
   * @throws {Error}
   */
  async connect(force = false) {
    if (!force && this.ready)
      throw new Error('already connect. please use force flag')

    return this._init(force)
  }

  /**
   * @param {?number} code
   * @return {Awaited<TWebSocket>}
   * @throws {Error}
   */
  async reconnect(code = null) {
    await this._disconnect(code)
    this._init(true)

    return this
  }

  /**
   * @param {number} code
   * @return {Promise<void>}
   */
  async disconnect(code = 1000) {
    return this._disconnect(code)
  }

  /**
   * @param {string|ArrayBuffer|Blob|ArrayBufferView} msg
   */
  send(msg) {
    if (!this._client) return

    this._client.send(msg)
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

    for (const callback of this[name]) {
      setTimeout(
        (callback, value) => {
          callback(value)
        },
        0,
        callback,
        value,
      )
    }
  }

  /**
   * @private
   * @param {?boolean} force
   * @return {Awaited<TWebSocket>}
   * @throws {Error}
   */
  async _init(force = false) {
    if (!force && this.ready) return this

    if (this.ready) {
      await this.disconnect(1000)
    }

    this._make()

    return this
  }

  _make() {
    if (this._connectionErrorCount > 15) return

    this._client = new ReconnectingWebSocket(
      this._options.url,
      this._options.protocols,
      this._options.make(),
    )

    this._openListener = (e) => {
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
    if (!this.ready) return

    this._close(code)
  }

  _close(code = 1000) {
    if (!code) code = 1000

    this._client.removeEventListener('open', this._openListener)
    this._client.removeEventListener('close', this._closeListener)
    this._client.removeEventListener('message', this._messageListener)
    this._client.removeEventListener('error', this._errorListener)

    this._openCallbacks.length = 0
    this._errorCallbacks.length = 0
    this._closeCallbacks.length = 0
    this._messageCallbacks.length = 0

    this._openListener = () => {}
    this._closeListener = () => {}
    this._closeListener = () => {}
    this._messageListener = () => {}

    this._client.close(code)
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

export const HTTPSPort = 443,
  HTTPPort = 80

export const DefaultTimeout = 7000,
  LongTimeout = DefaultTimeout * 2

export class Options {
  _host
  _port
  _secure
  _timeout
  _longpoll = false
  _protocols = []
  _customWS
  _endpoints = ['ws', 'longpoll']
  _version = `v2.6.4`

  _maxConnectionDelay = 10000
  _minReconnectionDelay = 1000 + Math.random() * 4000
  _reconnectionDelayGrowFactor = 1.3
  _minUptime = 5000
  _maxRetries = 10
  _maxEnqueuedMessages = Infinity
  _startClosed = false
  _debug = !!process.env.DEBUG

  /**
   * @param {string} host
   * @param {?number} timeout
   * @param {?boolean} secure
   * @param {?number} port
   * @param {?boolean} longpoll
   * @constructor
   */
  constructor(
    host,
    timeout = DefaultTimeout,
    secure = true,
    port = HTTPSPort,
    longpoll = false,
  ) {
    this._host = host
    this._port = port
    this._secure = secure
    this._timeout = timeout
    this._longpoll = longpoll
  }

  /**
   * @return {boolean}
   * @throws {Error}
   */
  check() {
    if (this._timeout > LongTimeout)
      throw new Error(`timeout less than LongTimeout`)

    // eslint-disable-next-line
    try {
      new URL(this.url)

      return true
    } catch (e) {
      throw e
    }
  }

  /**
   * @return {boolean}
   */
  get isLongPool() {
    // return this._longpoll

    return false
  }

  /**
   * @param {boolean} debug
   * @return {Options}
   */
  setDebug(debug) {
    this._debug = debug

    return this
  }

  /**
   * @return {boolean}
   */
  get debug() {
    return this._debug
  }

  /**
   * @param {?string} wsEndpoint
   * @param {?string} longpollEndpoint
   * @throws {Error}
   */
  setEndpoints(wsEndpoint = 'ws', longpollEndpoint = 'longpool') {
    if (typeof wsEndpoint !== 'string' || typeof longpollEndpoint !== 'string')
      throw new TypeError('invalid endpoints')

    this._endpoints = [wsEndpoint, longpollEndpoint]

    return this
  }

  /**
   * @return {Array<string>}
   */
  get endpoints() {
    return this._endpoints
  }

  /**
   * @param {number} delay
   * @return {Options}
   */
  setMaxConnectionDelay(delay) {
    this._maxConnectionDelay = delay

    return this
  }

  /**
   * @return {number}
   */
  get maxConnectionDelay() {
    return this._maxConnectionDelay
  }

  /**
   * @param {number} delay
   * @return {Options}
   */
  setMinReconnectionDelay(delay) {
    this._minReconnectionDelay = delay

    return this
  }

  /**
   * @return {number}
   */
  get minReconnectionDelay() {
    return this._minReconnectionDelay
  }

  /**
   * @param {number} gw
   * @return {Options}
   */
  setReconnectionDelayGrowFactor(gw) {
    this._reconnectionDelayGrowFactor = gw

    return this
  }

  /**
   * @return {number}
   */
  get reconnectionDelayGrowFactor() {
    return this._reconnectionDelayGrowFactor
  }

  /**
   * @param {number} ut
   * @return {Options}
   */
  setMinUptime(ut) {
    this._minUptime = ut

    return this
  }

  /**
   * @return {number}
   */
  get minUptime() {
    return this._minUptime
  }

  /**
   * @param {number} retries
   * @return {Options}
   */
  setMaxRetries(retries) {
    this._maxRetries = retries

    return this
  }

  /**
   * @return {number}
   */
  get maxRetries() {
    return this._maxRetries
  }

  /**
   * @param {number} em
   * @return {Options}
   */
  setMaxEnqueuedMessages(em) {
    this._maxEnqueuedMessages = em

    return this
  }

  /**
   * @return {number}
   */
  get maxEnqueuedMessages() {
    return this._maxEnqueuedMessages
  }

  /**
   * @param {Array<string>} protocols
   * @return {Options}
   * @throws {TypeError}
   */
  setProtocols(protocols) {
    if (!Array.isArray(protocols))
      throw new TypeError('protocols must be a Array')
    this._protocols = protocols

    return this
  }

  /**
   * @return {Array<string>}
   */
  get protocols() {
    return this._protocols
  }

  /**
   * @param {any} customWS
   * @return {Options}
   */
  setCustomWS(customWS) {
    this._customWS = customWS

    return this
  }

  /**
   * @return {any}
   */
  get customWS() {
    return this._customWS
  }

  /**
   * @return {string}
   */
  get url() {
    if (this._host.length > 2 && this._host.slice(0, 2) === 'ws') {
      return `${this._host}${![HTTPPort, HTTPSPort].includes(this._port) ? `:${this._port}` : ''}`
    }

    return `ws${this._secure ? 's' : ''}://${this._host}${![HTTPPort, HTTPSPort].includes(this._port) ? `:${this._port}` : ''}/${!this._longpoll ? this._endpoints[0] : this._endpoints[1]}`
  }

  /**
   * @return {{WebSocket: ?any, maxReconnectionDelay: number, minReconnectionDelay: number, reconnectionDelayGrowFactor: number, minUptime: number, connectionTimeout: number, maxRetries: number, maxEnqueuedMessages: number, startClosed: boolean, debug: boolean }}
   */
  make() {
    return {
      ...(this._customWS ? { WebSocket: this._customWS } : {}),
      maxReconnectionDelay: this._maxConnectionDelay,
      minReconnectionDelay: this._minReconnectionDelay,
      reconnectionDelayGrowFactor: this._reconnectionDelayGrowFactor,
      minUptime: this._minUptime,
      connectionTimeout: this._timeout,
      maxRetries: this._maxRetries,
      maxEnqueuedMessages: this._maxEnqueuedMessages,
      startClosed: this._startClosed,
      debug: this._debug,
      headers: {
        Client: `tcabaci-read-js-client/${this._version}`,
      },
    }
  }
}

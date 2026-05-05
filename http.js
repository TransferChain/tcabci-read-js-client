import { ERR_NETWORK, FetchError, INVALID_ARGUMENTS } from './errors.js'
import { Breaker } from './breaker.js'

export class HTTP {
  _baseURL
  _version = 'v2.7.0'
  _breaker = new Breaker()
  constructor(baseURL = null) {
    this._baseURL = baseURL
  }
  setBaseURL(baseURL) {
    this._baseURL = baseURL
    return this
  }
  /**
   * @param {string} uri
   * @param {RequestInit} req
   * @return {Promise<Record<string, any>>}
   */
  async request(uri, req) {
    req.cache = 'no-cache'
    req.headers = {
      Client: `tcabaci-read-js-client/${this._version}`,
    }
    req.priority = 'high'

    return this._breaker
      .execute(() => {
        return fetch(this._baseURL + uri, req)
      })
      .then((response) => this.handleResponse(response))
  }

  /**
   * @param {Response} response
   * @return {Promise<*>}
   */
  async handleResponse(response) {
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
   * @return {Promise<Error>}
   */
  async handleError(err, custom = null) {
    const code = err.code

    if (custom && typeof custom === 'object' && custom[code]) {
      return Promise.reject(custom[code])
    } else if (custom instanceof Error) {
      return Promise.reject(custom)
    }

    switch (code) {
      case 400:
        return Promise.reject(new Error(INVALID_ARGUMENTS))
      case 'ERR_NETWORK':
        return Promise.reject(new Error(ERR_NETWORK))
      default:
        return Promise.reject(err)
    }
  }
}

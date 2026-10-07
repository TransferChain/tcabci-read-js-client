import { SendThrow } from './util.js'
import { ERR_NETWORK, FetchError, INVALID_ARGUMENTS } from './errors.js'
import { Breaker } from './breaker.js'
import {
  CLIENT_VERSION,
  endpoint,
  positiveInteger,
  cloneAndFreeze,
  byteLength
} from './validation.js'

export class HTTP {
  _baseURL
  _breaker = new Breaker()
  _controllers = new Set()

  /**
   * @param {string|null} [baseURL=null]
   * @param {import('./types.js').ClientOptions} [options={}] Frozen config snapshot.
   */
  constructor(baseURL = null, options = {}) {
    this._options = Object.freeze({
      timeoutMs: options.timeoutMs ?? 30000,
      maxResponseBytes: options.maxResponseBytes ?? 64 * 1024 * 1024,
      maxRequestBytes: options.maxRequestBytes ?? 16 * 1024 * 1024,
      maxConcurrentRequests: options.maxConcurrentRequests ?? 32,
      allowInsecure: options.allowInsecure === true
    })

    for (const name of [
      'timeoutMs',
      'maxResponseBytes',
      'maxRequestBytes',
      'maxConcurrentRequests'
    ])
      positiveInteger(this._options[name], name)

    if (baseURL !== null) this.setBaseURL(baseURL)
  }

  setBaseURL(baseURL) {
    const url = endpoint(
      baseURL,
      ['https:', 'http:'],
      this._options.allowInsecure
    )

    if (url.search) throw new TypeError('Endpoint query is not supported')

    this._baseURL = url.href.replace(/\/$/, '')

    return this
  }

  /**
   * Abort all active requests without retaining caller abort reasons.
   * @returns {void}
   */
  abort() {
    for (const controller of this._controllers) controller.abort()
  }

  /**
   * Bounded JSON request with redirect rejection and a total deadline.
   * Owns only encoded/copied body bytes; wipes them after fetch/retries settle.
   * Fetch-owned response chunks and caller buffers are never mutated.
   * @param {string} uri
   * @param {import('./http.js').HTTPRequestInit} [req={}]
   * @param {import('./http.js').HTTPRequestOptions} [options={}]
   * @returns {Promise<import('./types.js').JSONValue>} Deeply frozen, readonly JSON snapshot.
   */
  async request(uri, req = {}, options = {}) {
    if (!this._baseURL) throw new TypeError('HTTP endpoint is not configured')

    if (this._controllers.size >= this._options.maxConcurrentRequests)
      throw new FetchError('Too many concurrent requests')

    if (
      typeof uri !== 'string' ||
      !uri.startsWith('/') ||
      uri.startsWith('//') ||
      uri.includes('#')
    )
      throw new TypeError('Invalid request path')

    const timeoutMs = positiveInteger(
        options.timeoutMs ?? this._options.timeoutMs,
        'timeoutMs'
      ),
      maxResponseBytes = positiveInteger(
        options.maxResponseBytes ?? this._options.maxResponseBytes,
        'maxResponseBytes'
      ),
      url = new URL(this._baseURL + uri)

    if (url.origin !== new URL(this._baseURL).origin)
      throw new TypeError('Invalid request origin')

    const controller = new AbortController(),
      callerSignal = options.signal ?? req.signal,
      abort = () => controller.abort()
    let timer, body, ownedBody

    this._controllers.add(controller)

    try {
      const headers = new Headers(req.headers)

      headers.set('Client', `tcabci-read-js-client/${CLIENT_VERSION}`)

      if (callerSignal?.aborted) abort()
      else callerSignal?.addEventListener('abort', abort, { once: true })

      timer = setTimeout(abort, timeoutMs)
      controller.signal.throwIfAborted()
      body = req.body

      if (typeof body === 'string') {
        // The string belongs to the caller; only this encoded copy is ours.
        if (byteLength(body) > this._options.maxRequestBytes)
          SendThrow(new FetchError('Request body exceeds limit'))

        ownedBody = new TextEncoder().encode(body)
      } else if (ArrayBuffer.isView(body)) {
        if (body.byteLength > this._options.maxRequestBytes)
          SendThrow(new FetchError('Request body exceeds limit'))

        ownedBody = new Uint8Array(
          new Uint8Array(body.buffer, body.byteOffset, body.byteLength)
        )
      } else if (body instanceof ArrayBuffer) {
        if (body.byteLength > this._options.maxRequestBytes)
          SendThrow(new FetchError('Request body exceeds limit'))

        ownedBody = new Uint8Array(body.slice(0))
      } else if (body != null) {
        SendThrow(new TypeError('Request body must be text or bytes'))
      }

      if (ownedBody) {
        if (ownedBody.byteLength > this._options.maxRequestBytes)
          SendThrow(new FetchError('Request body exceeds limit'))

        body = ownedBody

        if (!headers.has('Content-Type'))
          headers.set('Content-Type', 'application/json')
      }

      const method = (req.method ?? 'GET').toUpperCase(),
        execute = async () => {
          controller.signal.throwIfAborted()

          let response

          try {
            response = await fetch(url.href, {
              ...req,
              method,
              body,
              headers,
              cache: 'no-store',
              redirect: 'error',
              signal: controller.signal
            })
          } catch {
            if (controller.signal.aborted)
              throw new FetchError('Request aborted')

            throw new FetchError(ERR_NETWORK)
          }

          return this.handleResponse(
            response,
            maxResponseBytes,
            controller.signal
          )
        }

      return await this._breaker.execute(
        execute,
        controller.signal,
        options.retry ?? ['GET', 'HEAD'].includes(method)
      )
    } catch (error) {
      if (controller.signal.aborted) throw new FetchError('Request aborted')

      if (error instanceof FetchError) throw error

      // Do not preserve input, URLs, AbortSignal.reason or transport causes.
      throw new FetchError('Request failed')
    } finally {
      clearTimeout(timer)
      callerSignal?.removeEventListener('abort', abort)
      this._controllers.delete(controller)
      ownedBody?.fill(0)
      body = undefined
    }
  }

  /**
   * Read a bounded response, wipe owned byte copies, redact parsing failures.
   * Returned JSON strings and engine/native copies cannot be reliably erased.
   * @param {Response} response
   * @param {number} [maxBytes]
   * @param {AbortSignal} [signal]
   * @returns {Promise<import('./types.js').JSONValue>} Deeply frozen, readonly JSON snapshot.
   */
  async handleResponse(
    response,
    maxBytes = this._options.maxResponseBytes,
    signal
  ) {
    if (response.status < 200 || response.status >= 300) {
      await response.body?.cancel().catch(() => {})

      throw new FetchError('HTTP request failed').setStatus(response.status)
    }

    if (response.status === 204 || response.status === 205) return null

    const declared = Number(response.headers.get('content-length'))

    if (declared > maxBytes) {
      await response.body?.cancel().catch(() => {})

      throw new FetchError('Response body exceeds limit').setStatus(
        response.status
      )
    }

    const reader = response.body?.getReader()

    if (!reader)
      throw new FetchError('Invalid JSON response').setStatus(response.status)

    const chunks = []
    let size = 0,
      bytes,
      completed = false
    const abort = () => {
      reader.cancel().catch(() => {})
    }

    signal?.addEventListener('abort', abort, { once: true })

    try {
      signal?.throwIfAborted()

      while (true) {
        const { value, done } = await reader.read()

        signal?.throwIfAborted()

        if (done) {
          completed = true
          break
        }

        size += value.byteLength

        if (size > maxBytes)
          SendThrow(new FetchError('Response body exceeds limit'))

        // Fetch owns its chunks. Copy before retaining; never wipe shared input.
        if (chunks.length >= 65536)
          SendThrow(new FetchError('Response chunk limit exceeded'))

        chunks.push(new Uint8Array(value))
      }

      bytes = new Uint8Array(size)

      let offset = 0

      for (const chunk of chunks) {
        bytes.set(chunk, offset)
        offset += chunk.length
      }

      return cloneAndFreeze(
        JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
      )
    } catch (error) {
      if (signal?.aborted) throw new FetchError('Request aborted')

      if (error instanceof FetchError) throw error.setStatus(response.status)

      throw new FetchError('Invalid JSON response').setStatus(response.status)
    } finally {
      signal?.removeEventListener('abort', abort)

      if (!completed) await reader.cancel().catch(() => {})

      reader.releaseLock()

      for (const chunk of chunks) chunk.fill(0)

      chunks.length = 0
      bytes?.fill(0)
    }
  }

  async handleError(err, custom = null) {
    const code = err.status ?? err.code

    if (custom instanceof Error) throw custom

    if (custom && Object.hasOwn(custom, code)) throw custom[code]

    if (code === 400) throw new Error(INVALID_ARGUMENTS)

    if (code === 'ERR_NETWORK') throw new Error(ERR_NETWORK)

    throw err
  }
}

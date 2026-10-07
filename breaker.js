import { ConsecutiveBreaker, handleType, circuitBreaker } from 'cockatiel'
import { FetchError, ERR_NETWORK } from './errors.js'

const retryable = (error) =>
  error instanceof FetchError &&
  ([502, 503, 504].includes(error.status) || error.message === ERR_NETWORK)

export class Breaker {
  _circuitBreakerPolicy = circuitBreaker(handleType(FetchError, retryable), {
    halfOpenAfter: 10000,
    breaker: new ConsecutiveBreaker(10)
  })

  /**
   * @template T
   * @param {function(): Promise<T>} fn
   * @param {AbortSignal} [signal] Cancels retry backoff immediately.
   * @param {boolean} [retry=true] Disable for non-idempotent writes.
   * @returns {Promise<T>}
   */
  async execute(fn, signal, retry = true) {
    for (let attempt = 0; ; attempt++) {
      signal?.throwIfAborted()

      try {
        return await this._circuitBreakerPolicy.execute(fn, signal)
      } catch (error) {
        if (!retry || attempt >= 3 || signal?.aborted || !retryable(error))
          throw error

        await this._delay(
          Math.min(500 * 2 ** attempt, 15000) * (0.5 + Math.random()),
          signal
        )
      }
    }
  }

  async _delay(ms, signal) {
    let timer, abort

    try {
      await new Promise((resolve, reject) => {
        abort = () => reject(new FetchError('Request aborted'))
        timer = setTimeout(resolve, ms)

        if (signal?.aborted) abort()
        else signal?.addEventListener('abort', abort, { once: true })
      })
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener('abort', abort)
    }
  }
}

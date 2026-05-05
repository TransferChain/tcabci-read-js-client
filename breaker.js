import {
  ConsecutiveBreaker,
  ExponentialBackoff,
  retry,
  handleType,
  circuitBreaker,
  wrap,
} from 'cockatiel'
import { FetchError } from './errors.js'

export class Breaker {
  _options = {
    halfOpenAfter: 10 * 1000,
    breaker: new ConsecutiveBreaker(10),
  }
  _retryPolicy = retry(
    handleType(FetchError, (err) =>
      [502, 503, 504].includes(err.status),
    ).orType(Error, (err) => {
      return err.message.toLowerCase().search('failed to fetch') > -1
    }),
    {
      maxAttempts: 10,
      backoff: new ExponentialBackoff({
        initialDelay: 500,
        maxDelay: 15000,
      }),
    },
  )
  _circuitBreakerPolicy = circuitBreaker(
    handleType(FetchError, (err) =>
      [502, 503, 504].includes(err.status),
    ).orType(Error, (err) => {
      return err.message.toLowerCase().search('failed to fetch') > -1
    }),
    this._options,
  )
  _retryWithBreaker = wrap(this._retryPolicy, this._circuitBreakerPolicy)
  constructor() {}

  /**
   * @param {function} fn
   * @return {Promise<*>}
   */
  execute(fn) {
    return this._retryWithBreaker.execute(fn).catch((err) => {
      return Promise.reject(err)
    })
  }
}

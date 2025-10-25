export const ALREADY_CONNECTED = 'Already connected',
  NOT_CONNECTED = 'Not connected',
  ERR_NETWORK = 'Network Error',
  INVALID_ARGUMENTS = 'Check your arguments',
  INVALID_ARGUMENT_WITH_CS = (val) => {
    return INVALID_ARGUMENTS + ' ' + val
  },
  NOT_SUBSCRIBED = 'Not subscribed',
  ALREADY_SUBSCRIBED = 'Already subscribed',
  ADDRESSES_IS_EMPTY = 'Addresses is empty',
  BLOCK_NOT_FOUND = 'Block does not exist',
  TRANSACTION_TYPE_NOT_VALID = 'Transaction type is not valid',
  TRANSACTION_NOT_BROADCAST = 'Transaction can not be broadcast'

export class FetchError extends Error {
  status = -1
  response
  originError

  /**
   * @param {string} message
   */
  constructor(message) {
    super(message)
    this.name = 'FetchError'
  }

  /**
   * @param {number} status
   * @return {FetchError}
   */
  setStatus(status) {
    this.status = status

    return this
  }

  /**
   * @deprecated use .setStatus/1
   * @param {number} code
   * @return {FetchError}
   */
  setCode(code) {
    this.status = code

    return this
  }

  setResponse(data) {
    this.response = data

    return this
  }

  setOriginError(error) {
    this.originError = error

    return this
  }
}

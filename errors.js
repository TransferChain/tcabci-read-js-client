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
  code = -1
  response = {}

  /**
   * @param {string} message
   */
  constructor(message) {
    super(message)
    this.name = 'FetchError'
  }

  setCode(code) {
    this.code = code

    return this
  }

  setResponse(data) {
    this.response = {
      status: this.code,
      message: this.message,
      data: data,
    }

    return this
  }
}

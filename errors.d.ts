export declare type ErrMessage = string

export declare const ALREADY_CONNECTED: ErrMessage,
  NOT_CONNECTED: ErrMessage,
  ERR_NETWORK: ErrMessage,
  INVALID_ARGUMENTS: ErrMessage,
  INVALID_ARGUMENT_WITH_CS: (val: string) => ErrMessage,
  NOT_SUBSCRIBED: ErrMessage,
  ALREADY_SUBSCRIBED: ErrMessage,
  ADDRESSES_IS_EMPTY: ErrMessage,
  BLOCK_NOT_FOUND: ErrMessage,
  TRANSACTION_TYPE_NOT_VALID: ErrMessage,
  TRANSACTION_NOT_BROADCAST: ErrMessage

export declare class FetchError extends Error {
  code: number
  response: Record<string, any>
  originError?: Error
  constructor(message: string)
  setStatus(status: number): FetchError
  setCode(code: number): FetchError
  setResponse(data: Record<string, any>): FetchError
  setOriginError(error: Error): FetchError
}

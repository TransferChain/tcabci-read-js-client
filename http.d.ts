import { ClientOptions, JSONValue, RequestOptions } from './types.js'

export type HTTPRequestInit = Omit<RequestInit, 'body'> & {
  body?: string | ArrayBuffer | ArrayBufferView | null
}

export interface HTTPRequestOptions extends RequestOptions {
  retry?: boolean
}

export declare class HTTP {
  constructor(baseURL?: string | null, options?: ClientOptions)

  setBaseURL(baseURL: string): this

  abort(): void

  request(
    uri: string,
    req?: HTTPRequestInit,
    options?: HTTPRequestOptions
  ): Promise<JSONValue>

  handleResponse(
    response: Response,
    maxBytes?: number,
    signal?: AbortSignal
  ): Promise<JSONValue>

  handleError(
    err: Error & { status?: number; code?: number | string },
    custom?: Record<string, Error> | Error | null
  ): Promise<never>
}

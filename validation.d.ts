import { JSONValue } from './types.js'

export declare const CLIENT_VERSION: string, MAX_ADDRESSES: number

export declare function positiveInteger(value: number, name: string): number

export declare function endpoint(
  value: string,
  protocols: readonly string[],
  allowInsecure?: boolean
): URL

export declare function addresses(value: readonly string[]): string[]

export declare function signedData(
  value: Readonly<Record<string, string>>
): Record<string, string>

export declare function byteLength(
  value: string | ArrayBuffer | ArrayBufferView | Blob
): number

export declare function cloneAndFreeze(value: unknown): JSONValue

export declare function closeCode(value?: number | null): number

/** Convert date text/RFC3339Nano, Unix milliseconds or Date at millisecond precision. */
export declare function rfc3339Timestamp(value: string | number | Date): number

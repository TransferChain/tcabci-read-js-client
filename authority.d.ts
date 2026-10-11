/** Caller-owned result; the input is valid only during the synchronous call. */
export type WSAuthoritySigner = (payload: Uint8Array) => Uint8Array
export type Randomizer = (data: Uint8Array) => Uint8Array

export interface WSAuthorityOptions {
  address: string
  sign: WSAuthoritySigner
}

/** Fresh v3 header for one trusted WS handshake; never log or cache it. */
export declare function createWSAuthorityV3(
  address: string,
  sign: WSAuthoritySigner,
  randomizer?: Randomizer
): string

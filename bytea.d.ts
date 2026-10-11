/** Present PostgreSQL bytea JSON returned by the read node. */
export interface ByteaJSON {
  readonly Bytes: string
  readonly Status: 2
}

export declare class Bytea {
  constructor(bytes: Uint8Array, status: number)

  ToJSON(): string
}

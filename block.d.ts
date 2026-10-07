import { Transaction } from './transaction.js'
import { ParseResult } from './types.js'

export declare class Block {
  get Height(): number | undefined

  get TXS(): number | undefined

  get Hash(): string | undefined

  get Transactions(): readonly Transaction[] | undefined

  get ChainName(): string | undefined

  get ChainVersion(): string | undefined

  static FromJSON(value: string): ParseResult<'block', Readonly<Block>>

  static FromObject(
    obj: Record<string, unknown>
  ): ParseResult<'block', Readonly<Block>>
}

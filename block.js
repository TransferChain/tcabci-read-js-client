import { SendThrow } from './util.js'
import { Transaction } from './transaction.js'

export class Block {
  _height
  _txs
  _hash
  _transactions
  _chainName
  _chainVersion

  get Height() {
    return this._height
  }

  get TXS() {
    return this._txs
  }

  get Hash() {
    return this._hash
  }

  /** @returns {ReadonlyArray<Readonly<Transaction>>|undefined} Frozen parsed transactions. */
  get Transactions() {
    return this._transactions
  }

  get ChainName() {
    return this._chainName
  }

  get ChainVersion() {
    return this._chainVersion
  }

  /**
   * @param {string} value
   * @return {import('./types.js').ParseResult<'block', Readonly<Block>>}
   * @constructor
   */
  static FromJSON(value) {
    try {
      return Block.FromObject(JSON.parse(value))
    } catch {
      return { block: null, error: new Error('Invalid block JSON') }
    }
  }

  /** @param {Record<string, unknown>} obj @returns {import('./types.js').ParseResult<'block', Readonly<Block>>} */
  static FromObject(obj) {
    try {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj))
        SendThrow(new TypeError('Invalid block'))

      for (const field of ['height', 'txs']) {
        if (
          typeof obj[field] !== 'undefined' &&
          (!Number.isSafeInteger(obj[field]) || obj[field] < 0)
        )
          SendThrow(new TypeError('Invalid block counter'))
      }

      for (const field of ['hash', 'chain_name', 'chain_version']) {
        if (typeof obj[field] !== 'undefined' && typeof obj[field] !== 'string')
          SendThrow(new TypeError('Invalid block field'))
      }

      if (
        typeof obj.transactions !== 'undefined' &&
        (!Array.isArray(obj.transactions) || obj.transactions.length > 100000)
      )
        SendThrow(new TypeError('Invalid block transactions'))

      const bl = new Block()

      bl._transactions = []

      if (typeof obj.height !== 'undefined') bl._height = obj.height

      if (typeof obj.txs !== 'undefined') bl._txs = obj.txs

      if (typeof obj.hash !== 'undefined') bl._hash = obj.hash

      if (typeof obj.chain_name !== 'undefined') bl._chainName = obj.chain_name

      if (typeof obj.chain_version !== 'undefined')
        bl._chainVersion = obj.chain_version

      if (typeof obj.transactions !== 'undefined') {
        for (let i = 0; i < obj.transactions.length; i++) {
          const { transaction, error } = Transaction.FromObject(
            obj.transactions[i]
          )

          if (error) {
            return { block: null, error: error }
          }

          bl._transactions.push(transaction)
        }
      }

      Object.freeze(bl._transactions)

      return { block: Object.freeze(bl), error: null }
    } catch {
      return { block: null, error: new Error('Invalid block payload') }
    }
  }
}

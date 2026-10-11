import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Transaction, TX_TYPE_LIST } from '../transaction.js'
import { Block } from '../block.js'

const tx = {
  id: 'd736a9aaaff74de2cd4e6b42dd0c5b8afedb7576795ccb3b9070ee7e01d3c75ff5e30174c6a186ea4c8af77bf1dc3adcc4893c19d3c90992bc1b3429a4e09b54',
  height: 61318,
  version: 3,
  typ: 'initial_storage',
  sender_addr:
    'xSsTW8LxaDWem9K9HV9wsvso4o7SNZsMbZownWG25YYWBhQF5P71ZEqGgWTnVuu7pk4xa8crUcri6AGzpoVtaYF',
  recipient_addr:
    'xSsTW8LxaDWem9K9HV9wsvso4o7SNZsMbZownWG25YYWBhQF5P71ZEqGgWTnVuu7pk4xa8crUcri6AGzpoVtaYF',
  data: { Bytes: 'HSuCHg==', Status: 2 },
  sign: {
    Bytes:
      'pAVkgu3XrzmpX9/2jgH3zQ7/FGxfTtLGK+9bnbGcNBVI86z5jhnXyjeG7gWmVW/zoEuV2j3nT8JHoo++k4u8BA==',
    Status: 2
  },
  fee: 0,
  hash: '',
  order: 559230,
  chain_name: 'medusa-testnet',
  chain_version: 'v2',
  inserted_at: '2026-10-11T22:31:45.275371Z'
}

test('bytea signatures preserve shape, metadata and JSON round trips', () => {
  const { transaction, error } = Transaction.FromObject(tx)

  assert.equal(error, null)
  assert.deepEqual(transaction.Sign, tx.sign)
  assert.deepEqual(transaction.Data, tx.data)
  assert.equal(transaction.Order, tx.order)
  assert.equal(transaction.ChainName, tx.chain_name)
  assert.equal(transaction.ChainVersion, tx.chain_version)
  assert.equal(transaction.InsertedAt.toISOString(), '2026-10-11T22:31:45.275Z')
  assert.deepEqual(
    Transaction.FromJSON(transaction.ToJSON()).transaction.Sign,
    tx.sign
  )
  assert.deepEqual(transaction.ToObject().sign, tx.sign)
  assert.doesNotThrow(() => new Transaction(tx).Validate())
})

test('caller ownership and independent concurrent frozen snapshots', async () => {
  const input = structuredClone(tx),
    results = await Promise.all(
      Array.from(
        { length: 20 },
        async () => Transaction.FromObject(input).transaction
      )
    )

  input.sign.Bytes = 'changed'
  input.data.Bytes = 'changed'

  for (const transaction of results) {
    assert.ok(Object.isFrozen(transaction))
    assert.ok(Object.isFrozen(transaction.Sign))
    assert.ok(Object.isFrozen(transaction.Data))
    assert.deepEqual(transaction.Sign, tx.sign)
    assert.deepEqual(transaction.Data, tx.data)
    assert.notEqual(transaction.Sign, input.sign)
  }

  assert.equal(Object.isFrozen(input.sign), false)
  results[0].InsertedAt.setFullYear(2000)
  assert.equal(results[1].InsertedAt.getUTCFullYear(), 2026)
})

for (const sign of [
  '',
  null,
  undefined,
  1,
  [],
  {},
  { Bytes: '', Status: 2 },
  { Bytes: 1, Status: 2 },
  { Bytes: 'x' },
  { Bytes: 'x', Status: 0 },
  { Bytes: 'x', Status: 1 },
  { Bytes: 'x', Status: '2' },
  { Bytes: 'x', Status: 3 },
  new Date(0),
  new Uint8Array([1])
]) {
  test(`invalid signature ${JSON.stringify(sign)} is rejected without disclosure`, () => {
    const result = Transaction.FromObject({ ...tx, sign })

    assert.equal(result.transaction, null)
    assert.equal(result.error.message, 'Invalid transaction payload')
    assert.throws(() => new Transaction({ ...tx, sign }).Validate())
  })
}

for (const typ of TX_TYPE_LIST) {
  test(`legacy string signature remains valid for ${typ}`, () => {
    const result = Transaction.FromObject({ ...tx, typ, sign: 'legacy' })

    assert.equal(result.error, null)
    assert.equal(result.transaction.Sign, 'legacy')
  })
}

for (const fields of [
  { id: '' },
  { height: -1 },
  { height: Number.MAX_SAFE_INTEGER + 1 },
  { version: NaN },
  { fee: Infinity },
  { fee: -1 },
  { typ: 'invalid' },
  { order: {} },
  { hash: {} },
  { sender_addr: '' },
  { recipient_addr: 'x'.repeat(2049) },
  { chain_name: 1 },
  { chain_version: {} },
  { inserted_at: 'bad' },
  { data: undefined }
]) {
  test(`malformed transaction field ${Object.keys(fields)[0]} is rejected`, () => {
    assert.ok(Transaction.FromObject({ ...tx, ...fields }).error)
  })
}

test('cycles, depth, node budget, non-JSON values and throwing accessors fail safely', () => {
  const cyclic = {},
    throwing = {
      get Bytes() {
        throw new Error('SECRET')
      },
      Status: 2
    }
  let deep = 'leaf'

  cyclic.self = cyclic

  for (let i = 0; i < 34; i++) deep = { nested: deep }

  for (const data of [
    cyclic,
    deep,
    Array(100001).fill(0),
    { value: BigInt(1) },
    { value: Infinity },
    new Date(0)
  ]) {
    assert.equal(
      Transaction.FromObject({ ...tx, data }).error.message,
      'Invalid transaction payload'
    )
  }

  assert.equal(
    Transaction.FromObject({ ...tx, sign: throwing }).error.message,
    'Invalid transaction payload'
  )
  assert.equal(
    Transaction.FromJSON('{SECRET').error.message,
    'Invalid transaction JSON'
  )
})

test('prototype pollution is isolated and block parsing accepts bytea', () => {
  const sign = JSON.parse(
      '{"Bytes":"x","Status":2,"__proto__":{"polluted":true}}'
    ),
    result = Transaction.FromObject({ ...tx, sign }),
    block = Block.FromObject({ height: tx.height, transactions: [tx] })

  assert.equal(result.error, null)
  assert.equal({}.polluted, undefined)
  assert.ok(Object.isFrozen(result.transaction.Sign.__proto__))
  assert.equal(block.error, null)
  assert.deepEqual(block.block.Transactions[0].Sign, tx.sign)
})

for (const inserted_at of [0, new Date(0), '1970-01-01T00:00:00.000000Z']) {
  test(`date input ${String(inserted_at)} retains detached getters`, () => {
    const result = Transaction.FromObject({ ...tx, inserted_at })

    assert.equal(result.error, null)
    assert.equal(result.transaction.InsertedAt.getTime(), 0)
  })
}

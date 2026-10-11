// Run from projects/tcabci-read-js-client with Node 24.
// Synthetic data only. No production endpoint is contacted.
// FAIL means the stated safety/correctness expectation was violated.
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:http'
import { once } from 'node:events'

const base = pathToFileURL(`${process.cwd()}/`),
  { default: Client } = await import(new URL('client.js', base)),
  { HTTP } = await import(new URL('http.js', base)),
  { FetchError } = await import(new URL('errors.js', base)),
  { TWebSocket } = await import(new URL('websocket.js', base)),
  { Options } = await import(new URL('websocketOptions.js', base)),
  { default: Message } = await import(new URL('message.js', base)),
  { Transaction } = await import(new URL('transaction.js', base)),
  results = []

async function check(name, fn) {
  try {
    await fn()
    results.push({ name, status: 'PASS' })
  } catch (e) {
    results.push({ name, status: 'FAIL', reason: e.message })
  }
}

function client() {
  return new Client([], class {})
}

const tx = {
  id: 'synthetic-id',
  height: 1,
  version: 1,
  typ: 'message',
  sender_addr: 'synthetic-sender',
  recipient_addr: 'synthetic-recipient',
  data: 'synthetic-data',
  sign: 'synthetic-signature',
  fee: 1,
  chain_name: 'synthetic-chain',
  chain_version: 'v2'
}

await check(
  'F01 cross-origin redirect must not forward X-Signature',
  async () => {
    let leaked = false
    const target = createServer((req, res) => {
        leaked = req.headers['x-signature'] === 'synthetic-signature'
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end('{}')
      }),
      origin = createServer((req, res) => {
        res.writeHead(302, {
          Location: `http://127.0.0.1:${target.address().port}/sink`
        })
        res.end()
      })

    try {
      target.listen(0, '127.0.0.1')
      await once(target, 'listening')
      origin.listen(0, '127.0.0.1')
      await once(origin, 'listening')
      await new HTTP(`http://127.0.0.1:${origin.address().port}`)
        .request('/v1/tx/test', {
          method: 'GET',
          headers: { 'X-Signature': 'synthetic-signature' },
          signal: AbortSignal.timeout(2000)
        })
        .catch(() => {})
      assert.equal(
        leaked,
        false,
        'Synthetic signature reached a different origin'
      )
    } finally {
      origin.closeAllConnections()
      target.closeAllConnections()
      await Promise.all([
        new Promise((r) => origin.close(r)),
        new Promise((r) => target.close(r))
      ])
    }
  }
)

await check('F02 disconnect closes a CONNECTING socket', async () => {
  const ws = new TWebSocket(new Options('wss://example.invalid/ws'))
  let closed = 0

  ws._client = {
    readyState: 0,
    close() {
      closed++
    },
    removeEventListener() {}
  }
  await ws.disconnect()
  assert.equal(closed, 1, 'CONNECTING socket was not closed')
})

await check('F02 Stop cancels an in-progress connection', async () => {
  const c = client()
  let stopped = false

  c._ws = {
    disconnect: async () => {
      stopped = true
    }
  }
  await c.Stop().catch(() => {})
  assert.equal(stopped, true, 'Stop rejected without cancelling the socket')
})

await check(
  'F02 concurrent Start calls create only one connection',
  async () => {
    const oldConnect = TWebSocket.prototype.connect
    let count = 0

    TWebSocket.prototype.connect = async function () {
      count++

      return this
    }

    try {
      const c = client()

      await Promise.all([c.Start(), c.Start()])
      assert.equal(count, 1, 'Two socket wrappers were connected')
    } finally {
      TWebSocket.prototype.connect = oldConnect
    }
  }
)

await check(
  'F03 Stop releases subscription references and preserves caller bytes',
  async () => {
    const c = client(),
      caller = new Uint8Array([1, 2, 3])

    try {
      c._connected = true
      c._subscribedAddresses = ['synthetic-address']
      c._SubscribedSignedData = { proof: caller }
      c._ws = { disconnect: async () => {} }
      await c.Stop()
      assert.deepEqual([...caller], [1, 2, 3])
      assert.deepEqual(
        {
          addresses: c.SubscribeAddresses.length,
          signedFields: Object.keys(c.SubscribedSignedData).length
        },
        { addresses: 0, signedFields: 0 },
        'Address and signed-data references retained after Stop'
      )
    } finally {
      caller.fill(0)
    }
  }
)

await check('F03 queued callbacks must not run after disconnect', async () => {
  const ws = new TWebSocket(new Options('wss://example.invalid/ws'))

  ws._client = { readyState: 1, close() {}, removeEventListener() {} }

  let called = 0

  ws.addMessageListener(() => called++)
  ws._onMessage({ data: 'synthetic-data' })
  await ws.disconnect()
  await new Promise((r) => setTimeout(r, 10))
  assert.equal(called, 0, 'A queued callback ran after disconnect')
})

await check('F04 disconnected outgoing queue has a finite default cap', () => {
  assert.ok(
    Number.isFinite(new Options('example.invalid').maxEnqueuedMessages),
    'Default outgoing queue limit is Infinity'
  )
})

await check('F05 Message parsers return instances', () => {
  for (const result of [
    Message.FromJSON('{"type":2,"state":1}'),
    Message.FromObject({ type: 2, state: 1 })
  ]) {
    assert.equal(result.error, null)
    assert.ok(
      result.message instanceof Message,
      'Parser returned the Message class'
    )
  }
})

await check('F05 subscription ACK follows the active address lifecycle', () => {
  const c = client()

  c._callListenCallback('{"type":2,"state":1}')
  assert.equal(
    c.IsSubscribed(),
    false,
    'Unsolicited ACK created a subscription'
  )
  c._connected = true
  c._clientInstanceID = 'a'.repeat(128)
  c._ws = { send() {} }
  c.Subscribe(['synthetic-address'], { 'synthetic-address': 'synthetic-proof' })
  assert.equal(c.IsSubscribed(), false, 'Subscribe completed before its ACK')
  c._callListenCallback('{"type":2,"state":1}')
  assert.equal(
    c.IsSubscribed(),
    true,
    'ACK did not confirm requested addresses'
  )
  c.Unsubscribe()
  c._callListenCallback('{"type":2,"state":1}')
  assert.equal(
    c.IsSubscribed(),
    false,
    'Unsubscribe ACK recreated a subscription'
  )
})

await check('F06 default HTTP base URL is configured', () => {
  const c = client()

  assert.equal(
    c._httpClient._baseURL,
    c._readNodeAddress,
    'HTTP base URL is null'
  )
})

await check('F07 HTTP 503 is handled inside the retry boundary', async () => {
  const previous = globalThis.fetch,
    http = new HTTP('https://example.invalid')
  let errorInsidePolicy = false

  http._breaker = {
    execute: async (fn) => {
      try {
        return await fn()
      } catch (e) {
        errorInsidePolicy = e.status === 503

        throw e
      }
    }
  }
  globalThis.fetch = async () =>
    new Response('{"message":"synthetic failure"}', { status: 503 })

  try {
    await http.request('/', { method: 'GET' }).catch(() => {})
    assert.equal(
      errorInsidePolicy,
      true,
      '503 rejection happens outside breaker.execute'
    )
  } finally {
    globalThis.fetch = previous
  }
})

await check('F07 status-based custom error mapping', async () => {
  const mapped = new Error('mapped'),
    received = await new HTTP()
      .handleError(new FetchError('synthetic').setStatus(400), { 400: mapped })
      .catch((e) => e)

  assert.equal(
    received === mapped,
    true,
    'handleError reads code instead of status'
  )
})

await check('F07 non-JSON HTTP errors preserve status', async () => {
  const e = await new HTTP()
    .handleResponse(
      new Response('unavailable', {
        status: 503,
        statusText: 'Service Unavailable'
      })
    )
    .catch((e) => e)

  assert.equal(e.status, 503, 'Non-JSON error loses status')
})

await check(
  'F08 high-level HTTP request has a cancellation signal',
  async () => {
    const previous = globalThis.fetch
    let signal

    globalThis.fetch = async (url, req) => {
      signal = req.signal

      return new Response('{"data":[]}')
    }

    try {
      await client().Bulk(['synthetic-address'], {})
      assert.ok(
        signal instanceof AbortSignal,
        'No request timeout/cancellation signal'
      )
    } finally {
      globalThis.fetch = previous
    }
  }
)

await check(
  'F09 malformed JSON must not expose input in returned error',
  () => {
    const { error } = Transaction.FromJSON('FAKE_SECRET')

    assert.ok(error)
    assert.equal(
      error.message.includes('FAKE_SECRET'),
      false,
      'Raw parser error contains input text'
    )
  }
)

await check('F10 transaction validation rejects malformed fields', () => {
  const { error } = Transaction.FromObject({
    ...tx,
    id: {},
    sign: null,
    height: NaN,
    version: Infinity,
    fee: -1,
    inserted_at: 'invalid-date'
  })

  assert.ok(error, 'Malformed transaction fields were accepted')
})

await check('F10 message type rejects objects', () => {
  assert.ok(
    Message.FromObject({ type: {} }).error,
    'Object type passed validation'
  )
})

await check('F11 JSON transaction parsing preserves chain identity', () => {
  const { transaction, error } = Transaction.FromJSON(JSON.stringify(tx))

  assert.equal(error, null)
  assert.equal(
    transaction.ChainName,
    tx.chain_name,
    'ChainName was assigned to the class'
  )
})

await check(
  'F12 repeated subscriptions deduplicate addresses and retain proof',
  () => {
    const c = client(),
      sent = [],
      proof = { 'synthetic-address': 'synthetic-proof' }

    c._connected = true
    c._clientInstanceID = 'a'.repeat(128)
    c._ws = { send: (value) => sent.push(JSON.parse(value)) }
    assert.throws(() => c.Subscribe(['synthetic-address'], {}))
    assert.deepEqual(c.SubscribeAddresses, [])
    assert.equal(sent.length, 0, 'Invalid proof reached the socket')
    c.Subscribe(['synthetic-address'], proof)
    c.Subscribe(['synthetic-address'], {})
    assert.deepEqual(c.SubscribeAddresses, ['synthetic-address'])
    assert.equal(sent.length, 2)

    for (const message of sent) {
      assert.deepEqual(message.addresses, ['synthetic-address'])
      assert.deepEqual(message.signed_addresses, proof)
      assert.equal(message.client_instance_id, c._clientInstanceID)
    }

    assert.deepEqual(c.SubscribedSignedData, proof)
  }
)

await check(
  'C01 invalid JSON returns an error without escaping the parser',
  () => {
    assert.ok(Message.FromJSON('{').error)
    assert.ok(Transaction.FromJSON('{').error)
  }
)

await check('C02 __proto__ input does not pollute Object.prototype', () => {
  Message.FromJSON('{"type":2,"__proto__":{"polluted":true}}')
  assert.equal({}.polluted, undefined)
})

await check(
  'C03 valid transaction object round-trip preserves caller data',
  () => {
    const before = JSON.stringify(tx),
      { transaction, error } = Transaction.FromObject(tx)

    assert.equal(error, null)
    assert.equal(transaction.ToObject().data, tx.data)
    assert.equal(JSON.stringify(tx), before)
  }
)

for (const result of results) console.log(JSON.stringify(result))

const failed = results.filter((r) => r.status === 'FAIL').length

console.log(
  JSON.stringify({
    total: results.length,
    passed: results.length - failed,
    failed
  })
)
process.exitCode = failed ? 1 : 0

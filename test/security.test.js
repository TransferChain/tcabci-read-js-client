import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { WebSocketServer, WebSocket } from 'ws'
import Client from '../client.js'
import { HTTP } from '../http.js'
import { Breaker } from '../breaker.js'
import { TWebSocket } from '../websocket.js'
import { Options } from '../websocketOptions.js'
import Message from '../message.js'
import { Transaction, TX_TYPE_LIST } from '../transaction.js'
import { Block } from '../block.js'
import { FetchError } from '../errors.js'
import { SendThrow } from '../util.js'
import {
  addresses,
  signedData,
  MAX_ADDRESSES,
  cloneAndFreeze
} from '../validation.js'

const tx = {
    id: 'test',
    height: 1,
    version: 1,
    typ: 'message',
    sender_addr: 'sender',
    recipient_addr: 'recipient',
    data: { nested: ['test'] },
    sign: 'test',
    fee: 0,
    chain_name: 'chain',
    chain_version: 'v2',
    inserted_at: '1970-01-01T00:00:00.000Z'
  },
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  json = (value) =>
    new Response(JSON.stringify(value), {
      headers: { 'Content-Type': 'application/json' }
    })

async function withFetch(fn, run) {
  const original = globalThis.fetch

  globalThis.fetch = fn

  try {
    await run()
  } finally {
    globalThis.fetch = original
  }
}

function socketStub(state = 0) {
  return {
    readyState: state,
    removed: 0,
    closed: 0,
    removeEventListener() {
      this.removed++
    },
    close() {
      this.closed++
    }
  }
}

test('251 addresses and 2048 characters are accepted; boundaries reject', () => {
  assert.equal(MAX_ADDRESSES, 251)
  assert.equal(
    addresses(Array.from({ length: 251 }, (_, i) => `${i}`)).length,
    251
  )
  assert.equal(addresses(['x'.repeat(2048)])[0].length, 2048)

  for (const invalid of [
    [],
    [''],
    [1],
    ['x'.repeat(2049)],
    Array(252).fill('a')
  ])
    assert.throws(() => addresses(invalid))

  assert.deepEqual(addresses(['a', 'a']), ['a'])
})

test('subscription validates proof and deduplicates without freezing caller', () => {
  const c = new Client(),
    sent = [],
    proof = { a: 'test' },
    input = ['a']

  c._connected = true
  c._ws = { send: (value) => sent.push(JSON.parse(value)) }
  c.Subscribe(input, proof).Subscribe(input, proof)
  assert.deepEqual(c.SubscribeAddresses, ['a'])
  assert.equal(Object.isFrozen(input), false)
  assert.equal(Object.isFrozen(proof), false)
  proof.a = 'changed'
  input.push('b')
  assert.equal(c.SubscribedSignedData.a, 'test')
  assert.ok(Object.isFrozen(c.SubscribeAddresses))
  assert.ok(Object.isFrozen(c.SubscribedSignedData))
  assert.throws(() => c.Subscribe(['a'], null))
  assert.throws(() => c.Subscribe(['a'], {}, 'message'))
  assert.equal(sent.length, 2)
})

test('all address-list HTTP methods enforce boundaries before fetch', async () => {
  const c = new Client(),
    bad = ['x'.repeat(2049)]

  await withFetch(
    () => {
      throw new Error('must not fetch')
    },
    async () => {
      assert.throws(() => c.Bulk(bad, {}))
      assert.throws(() => c.TxSummary({ recipientAddrs: bad }))
      assert.throws(() => c.TxSearch({ senderAddrs: bad }))
    }
  )
})

test('frozen transaction snapshot preserves chain and detached Date', () => {
  const { transaction, error } = Transaction.FromObject(tx)

  assert.equal(error, null)
  assert.ok(Object.isFrozen(transaction))
  assert.ok(Object.isFrozen(transaction.Data.nested))
  assert.equal(Object.isFrozen(tx.data), false)
  assert.equal(transaction.ChainName, 'chain')
  transaction.InsertedAt.setFullYear(2025)
  assert.equal(transaction.InsertedAt.getTime(), 0)
  assert.equal(transaction.ToObject().inserted_at, tx.inserted_at)
  assert.equal(
    Transaction.FromJSON(JSON.stringify(tx)).transaction.ChainName,
    'chain'
  )
  assert.ok(Object.isFrozen(TX_TYPE_LIST))
  assert.ok(Object.isFrozen(new Client().Status()))
})

test('malformed numeric, identity and date fields fail without data in errors', () => {
  for (const fields of [
    { id: {} },
    { height: NaN },
    { version: Infinity },
    { sign: null },
    { fee: -1 },
    { inserted_at: 'bad' },
    { sender_addr: 'x'.repeat(2049) }
  ]) {
    assert.ok(Transaction.FromObject({ ...tx, ...fields }).error)
  }

  for (const parser of [Transaction, Message, Block]) {
    assert.doesNotMatch(
      parser.FromJSON('FAKE_SECRET').error.message,
      /FAKE_SECRET/
    )
    assert.doesNotMatch(
      parser.FromJSON('FAKE_SECRET').error.stack,
      /FAKE_SECRET/
    )
  }

  assert.ok(Message.FromObject({ type: {} }).error)
  assert.throws(() => cloneAndFreeze(new Uint8Array([1])))
})

test('Message ACK, block and transaction envelopes dispatch correctly', () => {
  const c = new Client(),
    observed = []

  c.SetListenCallback((...args) => observed.push(args))
  c._callListenCallback('{"type":2,"state":1}')
  assert.equal(c.IsSubscribed(), true)
  c._callListenCallback(
    JSON.stringify({ type: 0, data: { height: 1, transactions: [tx] } })
  )
  assert.ok(observed[0][0] instanceof Block)
  c._callListenCallback(JSON.stringify({ type: 1, data: tx }))
  assert.ok(observed[1][1] instanceof Transaction)
  c._callListenCallback('{"type":2,"state":2}')
  assert.equal(c.IsSubscribed(), false)

  const parsed = Message.FromJSON('{"type":2,"state":1}').message

  assert.ok(parsed instanceof Message)
  assert.ok(Object.isFrozen(parsed))
})

test('prototype pollution and excessive JSON nesting are rejected or isolated', () => {
  const value = cloneAndFreeze(JSON.parse('{"__proto__":{"polluted":true}}'))

  assert.equal({}.polluted, undefined)
  assert.ok(Object.hasOwn(value, '__proto__'))

  let deep = null

  for (let i = 0; i < 40; i++) deep = [deep]

  assert.throws(() => cloneAndFreeze(deep), /structural limit/)
  assert.throws(() => signedData([]))
})

test('disconnect closes CONNECTING and OPEN sockets, clears timers and listeners', async () => {
  for (const state of [0, 1, 2, 3]) {
    const ws = new TWebSocket(new Options('localhost')),
      stub = socketStub(state)

    ws._client = stub

    let called = 0

    ws.addMessageListener(() => called++)
    ws._onMessage({ data: 'test' })
    await ws.disconnect()
    await ws.disconnect()
    await sleep(5)
    assert.equal(stub.closed, 1)
    assert.equal(called, 0)
    assert.equal(ws._timers.size, 0)
    assert.equal(ws._client, undefined)
    assert.equal(ws.messageListeners.length, 0)
  }
})

test('concurrent Start shares connection; Stop cancels pending work and releases proof', async () => {
  const old = TWebSocket.prototype.connect
  let count = 0

  TWebSocket.prototype.connect = async function () {
    count++

    return this
  }

  const c = new Client(),
    caller = new Uint8Array([1, 2, 3])

  try {
    await Promise.all([c.Start(), c.Start()])
    assert.equal(count, 1)
    c._SubscribedSignedData = { caller }
    c._subscribedAddresses = ['a']
    await c.Stop()
    await c.Stop()
    assert.equal(c.Socket, null)
    assert.equal(c.SubscribeAddresses.length, 0)
    assert.deepEqual(c.SubscribedSignedData, {})
    assert.deepEqual([...caller], [1, 2, 3])
    c.SetListenCallback(() => {})
    await c.Dispose()
    assert.equal(c._listenCb, null)
  } finally {
    caller.fill(0)
    TWebSocket.prototype.connect = old
  }
})

test('actual loopback socket cycles leave no wrapper or timer after Stop', async () => {
  const server = new WebSocketServer({ host: '127.0.0.1', port: 0 })

  await once(server, 'listening')

  const c = new Client(
    ['http://127.0.0.1', `ws://127.0.0.1:${server.address().port}`],
    WebSocket
  )

  try {
    for (let i = 0; i < 3; i++) {
      const opened = new Promise((resolve) => c.SetSuccessCallback(resolve))

      await c.Start()
      await opened
      assert.equal(c.IsConnected(), true)

      const ws = c.Socket

      await c.Stop()
      assert.equal(ws._client, undefined)
      assert.equal(ws._timers.size, 0)
      assert.equal(c.IsConnected(), false)
    }

    await c.Start()

    const pending = c.Socket

    await c.Stop()
    await sleep(10)
    assert.equal(pending._client, undefined)
  } finally {
    await c.Dispose()

    for (const ws of server.clients) ws.terminate()

    await new Promise((r) => server.close(r))
  }
})

test('incoming message and callback limits close the socket and notify owner', () => {
  for (const overflow of ['message', 'callbacks']) {
    const options = new Options('localhost')
        .setMaxMessageBytes(2)
        .setMaxPendingCallbacks(1),
      ws = new TWebSocket(options),
      stub = socketStub(1)
    let closed = false

    ws._client = stub
    ws.addCloseListener(() => {
      closed = true
    })
    ws.addMessageListener(() => {})

    if (overflow === 'callbacks') ws.addMessageListener(() => {})

    ws._onMessage({ data: overflow === 'message' ? '123' : '1' })
    assert.equal(stub.closed, 1)
    assert.equal(closed, true)
    assert.equal(ws._timers.size, 0)
  }
})

test('no plaintext remote endpoint or credential URL without opt-in', () => {
  assert.throws(() => new HTTP('http://remote.invalid'))
  assert.throws(() => new HTTP('https://user:password@remote.invalid'))
  assert.throws(() => new Options('ws://remote.invalid').check())
  assert.equal(
    new Options('ws://remote.invalid').setAllowInsecure(true).check(),
    true
  )
  assert.ok(new HTTP('http://127.0.0.1'))
  assert.ok(new HTTP('http://remote.invalid', { allowInsecure: true }))
  assert.equal(new Options('localhost').make().maxEnqueuedMessages, 100)
  assert.equal(new Options('localhost').setDebug(true).make().debug, false)
})

test('302, 307 and 308 never send signature or signed body to redirect target', async () => {
  let reached = 0,
    status = 302
  const target = createServer((req, res) => {
      reached++
      res.end('{}')
    }),
    origin = createServer((req, res) => {
      res.writeHead(status, {
        Location: `http://127.0.0.1:${target.address().port}/sink`
      })
      res.end()
    })

  try {
    target.listen(0, '127.0.0.1')
    await once(target, 'listening')
    origin.listen(0, '127.0.0.1')
    await once(origin, 'listening')

    const http = new HTTP(`http://127.0.0.1:${origin.address().port}`)

    for (const code of [302, 307, 308]) {
      status = code
      await assert.rejects(
        http.request(
          '/tx',
          {
            method: code === 302 ? 'GET' : 'POST',
            headers: { 'X-Signature': 'test' },
            ...(code !== 302 ? { body: '{"proof":"test"}' } : {})
          },
          { retry: false }
        )
      )
    }

    assert.equal(reached, 0)
  } finally {
    origin.closeAllConnections()
    target.closeAllConnections()
    await Promise.all([
      new Promise((r) => origin.close(r)),
      new Promise((r) => target.close(r))
    ])
  }
})

test('HTTP owns, zeroes body copies, leaves caller bytes and headers unchanged', async () => {
  const caller = new Uint8Array([1, 2, 3, 4]),
    header = { test: 'test' },
    seen = []

  try {
    await withFetch(
      async (url, req) => {
        seen.push(req.body)

        return json({ ok: true })
      },
      async () => {
        await new HTTP('https://example.invalid').request('/tx', {
          method: 'POST',
          body: caller.subarray(1, 3),
          headers: header
        })
        assert.deepEqual([...caller], [1, 2, 3, 4])
        assert.deepEqual(header, { test: 'test' })
        assert.ok(seen[0].every((v) => v === 0))
        assert.notEqual(seen[0].buffer, caller.buffer)
      }
    )
  } finally {
    caller.fill(0)
  }
})

test('HTTP failure and cancellation zero owned bytes and redact abort reason', async () => {
  for (const mode of ['network', 'abort']) {
    const ac = new AbortController()
    let body

    await withFetch(
      async (url, req) => {
        body = req.body

        if (mode === 'network') throw new Error('FAKE_SECRET')

        return new Promise((resolve, reject) => {
          req.signal.addEventListener(
            'abort',
            () => reject(new Error('FAKE_SECRET')),
            { once: true }
          )
          ac.abort('FAKE_SECRET')
        })
      },
      async () => {
        const http = new HTTP('https://example.invalid'),
          error = await http
            .request(
              '/',
              { method: 'POST', body: 'test' },
              { signal: ac.signal }
            )
            .catch((e) => e)

        assert.ok(error instanceof FetchError)
        assert.doesNotMatch(error.message, /FAKE_SECRET/)
        assert.equal(error.originError, undefined)
        assert.ok(body.every((v) => v === 0))
        assert.equal(http._controllers.size, 0)
      }
    )
  }
})

test('parallel requests never wipe another request body before completion', async () => {
  const pending = []

  await withFetch(
    (url, req) => new Promise((resolve) => pending.push({ req, resolve })),
    async () => {
      const http = new HTTP('https://example.invalid'),
        first = http.request('/', { method: 'POST', body: 'first' }),
        second = http.request('/', { method: 'POST', body: 'second' })

      pending[0].resolve(json({}))
      await first
      assert.ok(pending[0].req.body.every((v) => v === 0))
      assert.ok(pending[1].req.body.some((v) => v !== 0))
      pending[1].resolve(json({}))
      await second
      assert.ok(pending[1].req.body.every((v) => v === 0))
    }
  )
})

test('response buffers are wiped on success, invalid JSON and abort; fetch chunks untouched', async () => {
  for (const mode of ['success', 'parse', 'abort']) {
    const chunk = new TextEncoder().encode(
        mode === 'parse' ? 'FAKE_SECRET' : '{"ok":true}'
      ),
      before = [...chunk],
      wiped = [],
      originalFill = Uint8Array.prototype.fill,
      ac = new AbortController()

    Uint8Array.prototype.fill = function (...args) {
      const result = originalFill.apply(this, args)

      if (args[0] === 0) wiped.push(this)

      return result
    }

    try {
      const response = new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(chunk)

              if (mode !== 'abort') controller.close()
            }
          })
        ),
        work = new HTTP().handleResponse(response, 1024, ac.signal)

      if (mode === 'abort') {
        await sleep(5)
        ac.abort()
      }

      const result = await work.catch((e) => e)

      if (mode === 'success') {
        assert.equal(result.ok, true)
        assert.ok(Object.isFrozen(result))
      } else assert.ok(result instanceof Error)

      assert.deepEqual([...chunk], before)
      assert.ok(wiped.length >= 1)
      assert.ok(wiped.every((bytes) => bytes.every((v) => v === 0)))
    } finally {
      Uint8Array.prototype.fill = originalFill
      chunk.fill(0)
    }
  }
})

test('deadline aborts fetch and stalled response; concurrency and byte limits reject', async () => {
  const http = new HTTP('https://example.invalid', {
    timeoutMs: 20,
    maxConcurrentRequests: 1
  })

  await withFetch(
    (url, req) =>
      new Promise((resolve, reject) => {
        req.signal.addEventListener('abort', () => reject(new Error('abort')), {
          once: true
        })
      }),
    async () => {
      const first = http.request('/', { method: 'POST' })

      await assert.rejects(http.request('/'), /concurrent/)
      await assert.rejects(first, /aborted/)
      assert.equal(http._controllers.size, 0)
    }
  )
  await withFetch(
    async () =>
      new Response(
        new ReadableStream({
          start(c) {
            c.enqueue(new Uint8Array([123]))
          }
        })
      ),
    async () => {
      await assert.rejects(http.request('/'), /aborted/)
    }
  )
  await assert.rejects(
    new HTTP().handleResponse(new Response('12345'), 4),
    /exceeds/
  )
  await assert.rejects(
    new HTTP().handleResponse(
      new Response('1', { headers: { 'content-length': '500' } }),
      4
    ),
    /exceeds/
  )
})

test('read 503 retries inside policy; broadcast remains one attempt', async () => {
  let count = 0

  await withFetch(
    async () => {
      count++

      return count === 1
        ? new Response('unavailable', { status: 503 })
        : json({ data: [] })
    },
    async () => {
      await new HTTP('https://example.invalid').request('/')
      assert.equal(count, 2)
    }
  )
  count = 0
  await withFetch(
    async () => {
      count++

      return new Response('unavailable', { status: 503 })
    },
    async () => {
      const c = new Client()

      await assert.rejects(c.Broadcast({ ...tx, type: 'message' }))
      assert.equal(count, 1)
    }
  )
})

test('cancel during retry backoff prevents another network request', async () => {
  let count = 0

  await withFetch(
    async () => {
      count++

      return new Response('', { status: 503 })
    },
    async () => {
      const http = new HTTP('https://example.invalid'),
        ac = new AbortController(),
        result = http.request('/', {}, { signal: ac.signal })

      await sleep(10)
      ac.abort()
      await assert.rejects(result, /aborted/)
      assert.equal(count, 1)
    }
  )
})

test('HTTP defaults, error status and request options reach high-level methods', async () => {
  const c = new Client(),
    seen = [],
    ac = new AbortController()

  await withFetch(
    async (url, req) => {
      seen.push({ url, req })

      return json({ data: tx })
    },
    async () => {
      await c.Tx('../id?a=b', 'test', { signal: ac.signal, timeoutMs: 1000 })
      assert.match(seen[0].url, /%2Fid%3Fa%3Db/)
      assert.ok(seen[0].req.signal instanceof AbortSignal)
      assert.match(seen[0].url, /^https:/)
    }
  )

  const e = await new HTTP()
    .handleResponse(new Response('not-json', { status: 503 }))
    .catch((e) => e)

  assert.equal(e.status, 503)
  assert.equal(e.code, 503)
  assert.equal(e.response, undefined)

  const mapped = new Error('mapped')

  assert.equal(
    await new HTTP()
      .handleError(new FetchError('x').setStatus(400), { 400: mapped })
      .catch((e) => e),
    mapped
  )
})

test('Stop wins over an overlapping Reconnect continuation', async () => {
  const original = TWebSocket.prototype.connect
  let count = 0

  TWebSocket.prototype.connect = async function () {
    count++

    return this
  }

  try {
    const c = new Client()

    await c.Start()

    const reconnect = c.Reconnect()

    await c.Stop()
    await reconnect
    assert.equal(count, 1)
    assert.equal(c.Socket, null)
  } finally {
    TWebSocket.prototype.connect = original
  }
})

test('offline queue enforces message count and UTF-8 byte budget', () => {
  const ws = new TWebSocket(
    new Options('localhost').setMaxEnqueuedMessages(2).setMaxMessageBytes(6)
  )

  ws._client = { ...socketStub(), bufferedAmount: 0, send() {} }
  ws.send('€')
  ws.send('€')
  assert.throws(() => ws.send(''), /queue/)
  assert.equal(ws._queuedBytes, 6)
  ws._close()
  assert.equal(ws._queuedBytes, 0)
})

test('caller headers and pre-aborted signals cannot leak payload through errors', async () => {
  const http = new HTTP('https://example.invalid'),
    ac = new AbortController()

  ac.abort('FAKE_SECRET')

  for (const [req, options] of [
    [{ headers: { x: 'FAKE_SECRET\nvalue' } }, {}],
    [{}, { signal: ac.signal }]
  ]) {
    const e = await http.request('/', req, options).catch((e) => e)

    assert.ok(e instanceof FetchError)
    assert.doesNotMatch(e.message, /FAKE_SECRET/)
    assert.equal(e.cause, undefined)
    assert.equal(http._controllers.size, 0)
  }
})

test('failed subscription ACK clears proof and addresses', () => {
  const c = new Client()

  c._SubscribedSignedData = { addr: 'test' }
  c._subscribedAddresses = ['addr']
  c._callListenCallback('{"type":2,"state":2}')
  assert.deepEqual(c.SubscribeAddresses, [])
  assert.deepEqual(c.SubscribedSignedData, {})
})

test('invalid close code preserves the active socket for a subsequent valid stop', async () => {
  const ws = new TWebSocket(new Options('localhost')),
    stub = socketStub()

  ws._client = stub
  await assert.rejects(ws.disconnect(1006), /close code/)
  assert.equal(ws._client, stub)
  await ws.disconnect()
  assert.equal(stub.closed, 1)
})

test('transaction order/hash are typed; identifier snapshots do not freeze callers', () => {
  for (const fields of [{ order: {} }, { hash: {} }])
    assert.ok(Transaction.FromObject({ ...tx, ...fields }).error)

  const identifier = { part: 'original' },
    result = Transaction.FromObject({ ...tx, identifier })

  assert.equal(result.error, null)
  assert.equal(Object.isFrozen(identifier), false)
  identifier.part = 'changed'
  assert.equal(result.transaction._identifier.part, 'original')
})

test('invalid low-level paths and UTF-8 request overflow fail before sending', async () => {
  await withFetch(
    () => {
      throw new Error('must not fetch')
    },
    async () => {
      const http = new HTTP('https://example.invalid', { maxRequestBytes: 2 })

      for (const path of ['//other.invalid', 'FAKE_SECRET', '/#FAKE_SECRET']) {
        const error = await http.request(path).catch((e) => e)

        assert.doesNotMatch(error.message, /FAKE_SECRET/)
      }

      await assert.rejects(
        http.request('/', { method: 'POST', body: '€' }),
        /exceeds/
      )
    }
  )
})

test('high-level transaction collections are frozen and input payloads stay mutable', async () => {
  await withFetch(
    async () => json({ data: [tx], total_count: 1 }),
    async () => {
      const result = await new Client().TxSearch({ recipientAddrs: ['a'] })

      assert.ok(Object.isFrozen(result))
      assert.ok(Object.isFrozen(result.txs))
      assert.equal(Object.isFrozen(tx), false)
    }
  )
})

test('SendThrow preserves error identity and completes finally buffer cleanup', () => {
  const expected = new FetchError('synthetic').setStatus(503),
    owned = new Uint8Array([1, 2, 3])
  let caught

  try {
    try {
      SendThrow(expected)
    } finally {
      owned.fill(0)
    }
  } catch (error) {
    caught = error
  }

  assert.equal(caught, expected)
  assert.equal(caught.status, 503)
  assert.deepEqual([...owned], [0, 0, 0])
})

test('date conversion accepts RFC3339Nano, Unix milliseconds and Date without strict format limits', () => {
  for (const [input, expected] of [
    ['1970-01-01T03:00:00+03:00', '1970-01-01T00:00:00.000Z'],
    ['1969-12-31T19:00:00-05:00', '1970-01-01T00:00:00.000Z'],
    ['2024-02-29t12:34:56.123456789z', '2024-02-29T12:34:56.123Z'],
    ['2024-02-29T15:34:56.123456789+03:00', '2024-02-29T12:34:56.123Z'],
    ['2024-01-01', '2024-01-01T00:00:00.000Z'],
    ['2024-01-01T24:00:00Z', '2024-01-02T00:00:00.000Z'],
    [0, '1970-01-01T00:00:00.000Z'],
    [-1, '1969-12-31T23:59:59.999Z'],
    [1704067200123, '2024-01-01T00:00:00.123Z'],
    [new Date(0), '1970-01-01T00:00:00.000Z']
  ]) {
    const direct = new Transaction({ ...tx, inserted_at: input }),
      parsed = Transaction.FromObject({ ...tx, inserted_at: input })

    assert.equal(parsed.error, null)
    assert.equal(direct.InsertedAt.toISOString(), expected)
    assert.equal(parsed.transaction.InsertedAt.toISOString(), expected)
    assert.equal(parsed.transaction.ToObject().inserted_at, expected)
    assert.equal(JSON.parse(parsed.transaction.ToJSON()).inserted_at, expected)
  }

  for (const input of [
    'bad',
    Infinity,
    NaN,
    1e20,
    null,
    {},
    true,
    new Date(NaN)
  ]) {
    assert.throws(
      () => new Transaction({ ...tx, inserted_at: input }),
      /timestamp/
    )
    assert.ok(Transaction.FromObject({ ...tx, inserted_at: input }).error)
  }

  const callerDate = new Date(0),
    direct = new Transaction({ ...tx, inserted_at: callerDate })

  callerDate.setTime(1000)
  assert.equal(direct.InsertedAt.valueOf(), 0)
  assert.equal(callerDate.valueOf(), 1000)
  assert.equal(new Transaction().InsertedAt, undefined)
})

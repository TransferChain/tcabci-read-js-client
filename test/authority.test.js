import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPairSync, sign, verify } from 'node:crypto'
import { createWSAuthorityV3 } from '../authority.js'
import { Options } from '../websocketOptions.js'
import Client from '../client.js'
import { CLIENT_VERSION } from '../constants.js'

const pair = generateKeyPairSync('ed25519'),
  address = 'dummyAuthorityAddress'

function decode(header) {
  const parts = header.split(';'),
    payload = Buffer.from(
      `read-node/ws-authority/v3\n${parts[0]}\n${parts[2]}\n${parts[3]}`
    ),
    signature = Buffer.from(parts[4], 'hex')

  try {
    assert.ok(parts.length === 5 && parts[1] === 'v3', 'Wrong authority format')
    assert.ok(parts[3].length === 64, 'Wrong nonce length')
    assert.ok(
      verify(null, payload, pair.publicKey, signature),
      'Invalid signature'
    )
  } finally {
    payload.fill(0)
    signature.fill(0)
  }

  return parts
}

test('v3 signs the envelope and preserves caller signature ownership', () => {
  let input, result, expected

  const header = createWSAuthorityV3(address, (payload) => {
    input = payload
    result = sign(null, payload, pair.privateKey)
    expected = Buffer.from(result)

    return result
  })

  try {
    decode(header)
    assert.ok(
      input.every((byte) => byte === 0),
      'Owned input was not cleared'
    )
    assert.ok(result.equals(expected), 'Caller signature was changed')
  } finally {
    result.fill(0)
    expected.fill(0)
  }
})

test('v3 clears owned input on signer failures and hides error details', () => {
  let input

  assert.throws(
    () =>
      createWSAuthorityV3(address, (payload) => {
        input = payload
        throw new Error('dummy-sensitive-detail')
      }),
    (error) =>
      error.message === 'Websocket authority creation failed' && !error.cause
  )
  assert.ok(
    input.every((byte) => byte === 0),
    'Failed input was not cleared'
  )
})

test('v3 rejects asynchronous signers without an unhandled rejection', async () => {
  assert.throws(
    () =>
      createWSAuthorityV3(address, async () => {
        throw new Error('dummy-sensitive-detail')
      }),
    /Websocket authority creation failed/
  )

  await new Promise((resolve) => setImmediate(resolve))
})

class DummyWS {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3
  constructor(url, protocols, options) {
    this.options = options
  }

  on() {}
}

test('Node-compatible transport gets a fresh header on each construction', () => {
  const returned = [],
    options = new Options('dummy.invalid').setCustomWS(DummyWS).setAuthority({
      address,
      sign: (payload) => {
        const result = sign(null, payload, pair.privateKey)

        returned.push(result)

        return result
      }
    }),
    WS = options.make().WebSocket

  try {
    const first = new WS('wss://dummy.invalid/ws'),
      second = new WS('wss://dummy.invalid/ws'),
      one = decode(first.options.headers['X-Authority']),
      two = decode(second.options.headers['X-Authority'])

    assert.ok(one[3] !== two[3], 'Nonce reused on reconnect')
    assert.equal(
      first.options.headers.Client,
      `tcabci-read-js-client/${CLIENT_VERSION}`
    )
    assert.ok(
      first.options.followRedirects === false,
      'Authority redirects enabled'
    )
    assert.ok(options.make().debug === false, 'Payload debug enabled')
    options.setAuthority(null)
    assert.throws(
      () => new WS('wss://dummy.invalid/ws'),
      /configuration released/
    )
  } finally {
    for (const bytes of returned) bytes.fill(0)
  }
})

test('browser transport rejects header authority instead of dropping it', () => {
  assert.throws(() =>
    new Options('dummy.invalid').setAuthority({
      address,
      sign: () => new Uint8Array([1])
    })
  )
})

test('Dispose releases the configured authority callback', async () => {
  const client = new Client([], DummyWS, null, null, {
    authority: { address, sign: () => new Uint8Array([1]) }
  })

  await client.Dispose()
  assert.ok(client._options._authority === null, 'Signer callback retained')
})

test('real reconnecting transport refreshes the v3 header on automatic reconnect', async () => {
  const { createServer } = await import('node:http'),
    { WebSocketServer, WebSocket } = await import('ws'),
    { once } = await import('node:events'),
    { TWebSocket } = await import('../websocket.js'),
    server = createServer(),
    sockets = new WebSocketServer({ server }),
    headers = [],
    versions = [],
    signatures = []
  let resolveTwo, transport

  const two = new Promise((resolve) => {
    resolveTwo = resolve
  })

  sockets.on('connection', (socket, request) => {
    headers.push(request.headers['x-authority'])
    versions.push(request.headers.client)

    if (headers.length === 1) socket.terminate()
    else resolveTwo()
  })

  server.listen(0, '127.0.0.1')
  await once(server, 'listening')

  try {
    const options = new Options(`ws://127.0.0.1:${server.address().port}/ws`)
      .setAllowInsecure(true)
      .setCustomWS(WebSocket)
      .setMinReconnectionDelay(10)
      .setMaxConnectionDelay(30)
      .setAuthority({
        address,
        sign: (payload) => {
          const result = sign(null, payload, pair.privateKey)

          signatures.push(result)

          return result
        }
      })

    transport = new TWebSocket(options)
    await transport.connect()

    let timer

    try {
      await Promise.race([
        two,
        new Promise((resolve, reject) => {
          timer = setTimeout(() => reject(new Error('Reconnect timeout')), 3000)
        })
      ])
    } finally {
      clearTimeout(timer)
    }

    const first = decode(headers[0]),
      second = decode(headers[1])

    assert.ok(first[3] !== second[3], 'Automatic reconnect reused a nonce')
    assert.deepEqual(versions, [
      `tcabci-read-js-client/${CLIENT_VERSION}`,
      `tcabci-read-js-client/${CLIENT_VERSION}`
    ])
    await transport.disconnect()
    options.setAuthority(null)
  } finally {
    if (transport) await transport.disconnect()

    for (const socket of sockets.clients) socket.terminate()
    for (const bytes of signatures) bytes.fill(0)

    headers.length = 0
    await new Promise((resolve) => sockets.close(resolve))
    await new Promise((resolve) => server.close(resolve))
  }
})

test('foreign-realm asynchronous signer errors are masked and consumed', async () => {
  const { runInNewContext } = await import('node:vm'),
    result = runInNewContext(
      'Promise.reject(new Error("dummy-sensitive-detail"))'
    )

  assert.throws(
    () => createWSAuthorityV3(address, () => result),
    /Websocket authority creation failed/
  )

  await new Promise((resolve) => setImmediate(resolve))
})

test('Listen is explicit and a rejection stops retries', async () => {
  const client = new Client([], DummyWS),
    sent = []

  client._setConnected(true)
  client._clientInstanceID = 'a'.repeat(128)
  client._ws = { send: (value) => sent.push(JSON.parse(value)) }
  assert.equal(sent.length, 0)
  client.Listen()
  assert.equal(sent[0].type, 'listen')
  assert.equal(sent[0].client_instance_id, client._clientInstanceID)
  assert.equal(client._listenRequested, true)

  let rejected = false,
    stopped = false

  client.SetErrorCallback(() => {
    rejected = true
  })
  client.Stop = async () => {
    stopped = true
    client._listenRequested = false
  }
  client._callListenCallback('{"type":3,"state":1}')
  assert.equal(rejected, false)
  client._callListenCallback('{"type":3,"state":2}')
  assert.ok(stopped && rejected)
  assert.equal(client._listenRequested, false)
  client._ws = null
  await client.Dispose()
})

test('Client repeats explicit Listen after reconnect and stops on rejection', async () => {
  const { createServer } = await import('node:http'),
    { WebSocketServer, WebSocket } = await import('ws'),
    { once } = await import('node:events'),
    server = createServer(),
    sockets = new WebSocketServer({ server }),
    signatures = [],
    instanceIDs = [],
    nonces = new Set()
  let connections = 0,
    listenCount = 0,
    resolveRejected

  const rejected = new Promise((resolve) => {
    resolveRejected = resolve
  })

  sockets.on('connection', (socket, request) => {
    connections++

    const fields = decode(request.headers['x-authority'])

    assert.ok(!nonces.has(fields[3]), 'Authority nonce reused')
    nonces.add(fields[3])
    socket.on('message', (raw) => {
      const message = JSON.parse(raw.toString())

      raw.fill(0)
      assert.equal(message.type, 'listen')
      assert.match(message.client_instance_id, /^[0-9a-f]{128}$/)
      instanceIDs.push(message.client_instance_id)
      listenCount++

      if (listenCount === 1) {
        socket.send('{"type":3,"state":1}')
        socket.terminate()
      } else {
        socket.send('{"type":3,"state":2}')
      }
    })
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')

  const base = `127.0.0.1:${server.address().port}`,
    client = new Client(
      [`http://${base}`, `ws://${base}/ws`],
      WebSocket,
      null,
      null,
      {
        allowInsecure: true,
        authority: {
          address,
          sign: (payload) => {
            const signature = sign(null, payload, pair.privateKey)

            signatures.push(signature)

            return signature
          }
        }
      }
    )

  client._options.setMinReconnectionDelay(10).setMaxConnectionDelay(30)
  client.SetSuccessCallback(() => {
    if (!client._listenRequested) client.Listen()
  })
  client.SetErrorCallback((error) => {
    if (error.message === 'Listen rejected') resolveRejected()
  })

  let timer

  try {
    await client.Start()
    await Promise.race([
      rejected,
      new Promise((resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error('Listen reconnect timeout')),
          3000
        )
      })
    ])
    await new Promise((resolve) => setTimeout(resolve, 100))
    assert.equal(connections, 2)
    assert.equal(listenCount, 2)
    assert.equal(instanceIDs[0], instanceIDs[1])
    assert.equal(client._listenRequested, false)
  } finally {
    clearTimeout(timer)
    await client.Dispose()

    for (const socket of sockets.clients) socket.terminate()
    for (const signature of signatures) signature.fill(0)

    nonces.clear()
    await new Promise((resolve) => sockets.close(resolve))
    await new Promise((resolve) => server.close(resolve))
  }
})

test('successive subscriptions retain proofs and unsubscribe ACK stays cleared', async () => {
  const client = new Client([], DummyWS),
    sent = [],
    first = { a: 'dummy-first-proof' },
    second = { b: 'dummy-second-proof', unused: 'dummy-unused-proof' }

  client._setConnected(true)
  client._ws = { send: (value) => sent.push(JSON.parse(value)) }
  client._clientInstanceID = 'a'.repeat(128)
  client.Subscribe(['a'], first).Subscribe(['b'], second)
  assert.deepEqual(sent[1].addresses, ['a', 'b'])
  assert.deepEqual(sent[1].signed_addresses, {
    a: 'dummy-first-proof',
    b: 'dummy-second-proof'
  })
  second.b = 'caller-changed'
  assert.equal(client.SubscribedSignedData.b, 'dummy-second-proof')
  client._callListenCallback('{"type":2,"state":1}')
  assert.equal(client.IsSubscribed(), true)
  client.Unsubscribe()
  client._callListenCallback('{"type":2,"state":1}')
  assert.equal(client.IsSubscribed(), false)
  assert.deepEqual(client.SubscribeAddresses, [])
  assert.deepEqual(client.SubscribedSignedData, {})
  client._ws = null
  await client.Dispose()
})

test('anonymous Node WS sends client version on initial handshake and reconnect', async () => {
  const { createServer } = await import('node:http'),
    { WebSocketServer, WebSocket } = await import('ws'),
    { once } = await import('node:events'),
    { TWebSocket } = await import('../websocket.js'),
    server = createServer(),
    sockets = new WebSocketServer({ server }),
    versions = []
  let resolveTwo, transport, timer

  const two = new Promise((resolve) => {
    resolveTwo = resolve
  })

  sockets.on('connection', (socket, request) => {
    versions.push(request.headers.client)

    if (versions.length === 1) socket.terminate()
    else resolveTwo()
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')

  try {
    const options = new Options(`ws://127.0.0.1:${server.address().port}/ws`)
      .setAllowInsecure(true)
      .setCustomWS(WebSocket)
      .setMinReconnectionDelay(10)
      .setMaxConnectionDelay(30)

    transport = new TWebSocket(options)
    await transport.connect()
    await Promise.race([
      two,
      new Promise((resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error('Version handshake timeout')),
          3000
        )
      })
    ])
    assert.deepEqual(versions, [
      `tcabci-read-js-client/${CLIENT_VERSION}`,
      `tcabci-read-js-client/${CLIENT_VERSION}`
    ])
  } finally {
    clearTimeout(timer)

    if (transport) await transport.disconnect()

    for (const socket of sockets.clients) socket.terminate()

    await new Promise((resolve) => sockets.close(resolve))
    await new Promise((resolve) => server.close(resolve))
  }
})

test('subscription instance ID uses SDK passKey vector and clears owned bytes on success and failures', async () => {
  const { passKey } = await import('../passKey.js'),
    original = Object.getOwnPropertyDescriptor(globalThis, 'crypto'),
    entropyViews = [],
    asciiViews = [],
    digestViews = [],
    { createHash } = await import('node:crypto')
  let failEntropy = false,
    failDigest = false

  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: {
      getRandomValues(bytes) {
        entropyViews.push(bytes)
        bytes.forEach((_, index) => {
          bytes[index] = index
        })
        if (failEntropy) throw new Error('dummy entropy failure')
        return bytes
      },
      subtle: {
        async digest(algorithm, bytes) {
          assert.equal(algorithm, 'SHA-512')
          asciiViews.push(bytes)
          assert.equal(bytes.length, 144)
          assert.match(new TextDecoder().decode(bytes), /^[0-9a-f-]+$/)
          await Promise.resolve()
          assert.ok(
            bytes.some((byte) => byte !== 0),
            'ASCII cleared before digest finished'
          )
          if (failDigest) throw new Error('dummy digest failure')
          const result = Uint8Array.from(
            createHash('sha512').update(bytes).digest()
          )
          digestViews.push(result)
          return result.buffer
        }
      }
    }
  })
  try {
    assert.equal(
      await passKey(),
      'bf36678648f39d67892be9fa74144d31c295bcb577a96e2f8459d8a3f89bd665f1822d3ed52fcdaecb4073e6701d49c557c051321a3279365611ed18efc15736'
    )
    const parallel = await Promise.all([passKey(), passKey()])
    assert.equal(parallel[0], parallel[1])
    assert.notEqual(entropyViews[1], entropyViews[2])
    failDigest = true
    await assert.rejects(passKey())
    failDigest = false
    failEntropy = true
    await assert.rejects(passKey())
    for (const bytes of [...entropyViews, ...asciiViews, ...digestViews])
      assert.ok(
        bytes.every((byte) => byte === 0),
        'Owned passKey buffer retained'
      )
  } finally {
    Object.defineProperty(globalThis, 'crypto', original)
  }
})

test('wire subscription instance ID survives reconnect and differs for equal-address clients', async () => {
  const { createServer } = await import('node:http'),
    { WebSocketServer, WebSocket } = await import('ws'),
    { once } = await import('node:events'),
    server = createServer(),
    sockets = new WebSocketServer({ server }),
    seen = []
  let resolveMessages
  const received = new Promise((resolve) => {
    resolveMessages = resolve
  })

  sockets.on('connection', (socket) => {
    socket.on('message', (raw) => {
      const message = JSON.parse(raw.toString())
      raw.fill(0)
      assert.equal(message.type, 'subscribe')
      assert.match(message.client_instance_id, /^[0-9a-f]{128}$/)
      seen.push(message)
      if (seen.length === 1) socket.terminate()
      if (seen.length === 3) resolveMessages()
    })
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const base = `127.0.0.1:${server.address().port}`,
    first = new Client(
      [`http://${base}`, `ws://${base}`],
      WebSocket,
      null,
      null,
      { allowInsecure: true }
    ),
    second = new Client(
      [`http://${base}`, `ws://${base}`],
      WebSocket,
      null,
      null,
      { allowInsecure: true }
    )
  let secondStarted = false
  first.SetSuccessCallback(() => {
    first.Subscribe(['same-address'], { 'same-address': 'dummy-proof' })
    if (seen.length >= 1 && !secondStarted) {
      secondStarted = true
      void second.Start()
    }
  })
  second.SetSuccessCallback(() =>
    second.Subscribe(['same-address'], { 'same-address': 'dummy-proof' })
  )
  let timer
  try {
    await first.Start()
    await Promise.race([
      received,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('subscription reconnect timeout')),
          5000
        )
      })
    ])
    assert.equal(
      seen.filter(
        (message) => message.client_instance_id === first._clientInstanceID
      ).length,
      2
    )
    assert.equal(
      seen.filter(
        (message) => message.client_instance_id === second._clientInstanceID
      ).length,
      1
    )
    assert.notEqual(first._clientInstanceID, second._clientInstanceID)
  } finally {
    clearTimeout(timer)
    await first.Dispose()
    await second.Dispose()
    for (const socket of sockets.clients) socket.terminate()
    await new Promise((resolve) => sockets.close(resolve))
    await new Promise((resolve) => server.close(resolve))
  }
})

test('Stop during passKey generation prevents stale connection and later Start shares identity', async () => {
  const { TWebSocket } = await import('../websocket.js'),
    { createHash } = await import('node:crypto'),
    descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto'),
    originalConnect = TWebSocket.prototype.connect,
    client = new Client([], DummyWS)
  let release,
    entropyCalls = 0,
    connections = 0

  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: {
      getRandomValues(bytes) {
        entropyCalls++
        bytes.fill(7)
        return bytes
      },
      subtle: {
        digest(_algorithm, ascii) {
          return new Promise((resolve) => {
            release = () =>
              resolve(
                Uint8Array.from(createHash('sha512').update(ascii).digest())
                  .buffer
              )
          })
        }
      }
    }
  })
  TWebSocket.prototype.connect = async function () {
    connections++
    return this
  }
  try {
    const first = client.Start(),
      shared = client.Start()
    await client.Stop()
    const next = client.Start()
    release()
    await Promise.all([first, shared, next])
    assert.equal(entropyCalls, 1)
    assert.equal(connections, 1)
    assert.match(client._clientInstanceID, /^[0-9a-f]{128}$/)
    assert.equal(client._instanceIDPromise, null)
  } finally {
    await client.Dispose()
    TWebSocket.prototype.connect = originalConnect
    Object.defineProperty(globalThis, 'crypto', descriptor)
  }
})

test('failed passKey initialization allows retry without opening a socket', async () => {
  const { TWebSocket } = await import('../websocket.js'),
    descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto'),
    originalCrypto = globalThis.crypto,
    originalConnect = TWebSocket.prototype.connect,
    client = new Client([], DummyWS)
  let attempts = 0,
    connections = 0

  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: {
      getRandomValues(bytes) {
        attempts++
        if (attempts === 1) throw new Error('dummy entropy failure')
        return originalCrypto.getRandomValues(bytes)
      },
      subtle: originalCrypto.subtle
    }
  })
  TWebSocket.prototype.connect = async function () {
    connections++
    return this
  }
  try {
    await assert.rejects(client.Start(), /Connection failed/)
    assert.equal(connections, 0)
    assert.equal(client._instanceIDPromise, null)
    await client.Start()
    assert.equal(attempts, 2)
    assert.equal(connections, 1)
  } finally {
    await client.Dispose()
    TWebSocket.prototype.connect = originalConnect
    Object.defineProperty(globalThis, 'crypto', descriptor)
  }
})

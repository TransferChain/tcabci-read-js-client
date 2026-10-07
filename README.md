# TCABCI Read Node JavaScript Client

HTTP queries, transaction broadcasts and WebSocket subscriptions for the
TransferChain read network. Uses ESM and supports Node.js 24+ or browsers with
Fetch, WebSocket, AbortController, TextEncoder and TextDecoder.

```sh
npm install @tchain/tcabci-read-js-client
```

```js
import TCaBCIClient from '@tchain/tcabci-read-js-client'

const client = new TCaBCIClient()

client.SetSuccessCallback(() => {
  // Obtain a valid address-to-signature map from your signing layer.
  client.Subscribe(['<public-address>'], {
    '<public-address>': '<signature>'
  })
})
client.SetListenCallback((block, transaction, message) => {
  // Handle the received immutable data snapshot.
})
client.SetErrorCallback(error => {
  // Handle a sanitized transport/protocol error.
})

await client.Start() // Starts connecting; the success callback reports OPEN.
// When finished:
await client.Dispose() // Also clears application callbacks.
```

For an injected WebSocket implementation, pass its constructor as the second
argument. The first argument is an optional `[httpsURL, wssURL]` endpoint pair;
the third and fourth arguments select the chain. The fifth argument accepts
client limits and transport options.

```js
const client = new TCaBCIClient([], WebSocket, 'medusa', 'v2', {
  timeoutMs: 30000,
  maxRequestBytes: 16 * 1024 * 1024,
  maxResponseBytes: 64 * 1024 * 1024,
  maxConcurrentRequests: 32,
  maxMessageBytes: 16 * 1024 * 1024,
  maxEnqueuedMessages: 100,
  maxPendingCallbacks: 1000
})

const controller = new AbortController()
const result = await client.Tx('<transaction-id>', '<signature>', {
  signal: controller.signal,
  timeoutMs: 10000
})
```

Each address list accepts 1–251 entries; each address accepts 1–2048 characters.
Active subscriptions are deduplicated and bounded to 251 addresses. Signed data
is an address-to-signature string map. Caller objects are neither frozen nor
overwritten.

HTTP redirects are rejected. Remote plaintext endpoints require explicit
`allowInsecure: true`; exact localhost/loopback endpoints support local
integration. Read-only operations may retry transient failures; broadcasts are
attempted once. The deadline includes retries and response consumption. HTTP
errors retain status, without response bodies or raw parser causes.

`Stop()` is idempotent, aborts HTTP work and releases subscription state. Await
pending HTTP promises to observe their cancellation and completed byte cleanup.
`Dispose()` additionally drops application callback references. Close codes use
browser-compatible values: 1000 or 3000–4999. Offline binary messages are
rejected; string queues have finite count and byte limits. Transport payload
logging is disabled, including when `SetDebug(true)` is called. Frozen snapshots
do not imply secure erasure of JavaScript strings.

TypeScript declarations accompany the ESM API. Tests are intentionally local
only under the ignored `test/` directory and are excluded from the package.

## License

Apache License, Version 2.0. See [LICENSE](LICENSE).

// Public synthetic zero-seed fixture; stdout is captured inside the isolated test.
import { createPrivateKey, sign } from 'node:crypto'
import { createWSAuthorityV3 } from '../authority.js'

const chunks = []

for await (const chunk of process.stdin) chunks.push(chunk)

const input = Buffer.concat(chunks),
  seed = Buffer.alloc(32),
  prefix = Buffer.from('302e020100300506032b657004220420', 'hex'),
  der = Buffer.concat([prefix, seed]),
  key = createPrivateKey({ key: der, format: 'der', type: 'pkcs8' }),
  signatures = []

try {
  const header = createWSAuthorityV3(input.toString(), (payload) => {
    const bytes = sign(null, payload, key)

    signatures.push(bytes)

    return bytes
  })

  process.stdout.write(header)
} finally {
  for (const bytes of [...chunks, input, seed, prefix, der, ...signatures])
    bytes.fill(0)
}

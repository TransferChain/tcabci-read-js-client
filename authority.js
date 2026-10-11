import { SendThrow } from './util.js'

/**
 * Create a fresh read-node WS authority v3 header, valid for ten seconds and one
 * handshake. Use only with trusted endpoints; never log or cache the result.
 * The signer is synchronous, receives an owned Uint8Array valid during its
 * call, and returns caller-owned signature bytes. No private key is retained.
 * @param {string} address Configured TransferChain public address.
 * @param {(payload: Uint8Array) => Uint8Array} sign Synchronous signer.
 * @param {(Uint8Array) => Uint8Array} randomizer
 * @returns {string}
 */
export function createWSAuthorityV3(address, sign, randomizer = null) {
  if (
    typeof address !== 'string' ||
    address.length === 0 ||
    address.length > 2048 ||
    /[;\r\n]/.test(address) ||
    typeof sign !== 'function'
  )
    throw new TypeError('Invalid websocket authority configuration')

  const nonce = new Uint8Array(32),
    hex = (bytes) =>
      Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  let payload, signature

  try {
    if (!randomizer) globalThis.crypto.getRandomValues(nonce)
    else randomizer(nonce)

    const timestamp = (BigInt(Date.now()) * 1000000n).toString(),
      nonceHex = hex(nonce)

    payload = new TextEncoder().encode(
      `read-node/ws-authority/v3\n${address}\n${timestamp}\n${nonceHex}`
    )

    const result = sign(payload)

    if (result && typeof result.then === 'function') {
      Promise.resolve(result).catch(() => {})
      SendThrow(new TypeError('Authority signer must be synchronous'))
    }

    if (
      !(result instanceof Uint8Array) ||
      result.length === 0 ||
      result.length > 8192
    )
      SendThrow(new TypeError('Invalid websocket authority signature'))

    signature = new Uint8Array(result)

    return `${address};v3;${timestamp};${nonceHex};${hex(signature)}`
  } catch {
    throw new Error('Websocket authority creation failed')
  } finally {
    nonce.fill(0)
    payload?.fill(0)
    signature?.fill(0)
  }
}

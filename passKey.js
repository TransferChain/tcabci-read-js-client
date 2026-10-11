/**
 * SHA-512 of four concatenated lowercase UUID-v4 ASCII identifiers, matching
 * SDK passKey defaults. Uses WebCrypto without a dependency on the SDK.
 * Owned entropy, ASCII and digest bytes are cleared on success and failure.
 * Immutable returned hex and runtime/native copies cannot be explicitly erased.
 * @param {(Uint8Array) => Uint8Array} randomizer
 * @returns {Promise<string>} 128 lowercase hex characters; not an auth credential.
 */
export async function passKey(randomizer = null) {
  const entropy = new Uint8Array(64),
    ascii = new Uint8Array(144)
  let digest

  try {
    if (!randomizer) globalThis.crypto.getRandomValues(entropy)
    else randomizer(entropy)

    let offset = 0

    for (let uuid = 0; uuid < 4; uuid++) {
      const start = uuid * 16

      entropy[start + 6] = (entropy[start + 6] & 15) | 64
      entropy[start + 8] = (entropy[start + 8] & 63) | 128

      for (let index = 0; index < 16; index++) {
        if ([4, 6, 8, 10].includes(index)) ascii[offset++] = 45

        const value = entropy[start + index]

        for (const nibble of [value >>> 4, value & 15])
          ascii[offset++] = nibble < 10 ? 48 + nibble : 87 + nibble
      }
    }

    digest = new Uint8Array(
      await globalThis.crypto.subtle.digest('SHA-512', ascii)
    )

    return Array.from(digest, (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('')
  } finally {
    entropy.fill(0)
    ascii.fill(0)
    digest?.fill(0)
  }
}

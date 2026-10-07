/**
 * Synchronously throw the supplied value without wrapping or retaining it.
 * Catch/finally behavior and Error identity are preserved.
 * @param {unknown} error The value to throw.
 * @returns {never}
 * @throws {unknown} The exact supplied value.
 */
export function SendThrow(error) {
  throw error
}

/** Parse JSON without retaining untrusted input in parse errors. */
export function fromJSON(data) {
  try {
    return JSON.parse(data)
  } catch {
    throw new Error('Invalid JSON payload')
  }
}

/** @param {string} str @returns {boolean} */
export function isJSON(str) {
  try {
    JSON.parse(str)

    return true
  } catch {
    return false
  }
}
